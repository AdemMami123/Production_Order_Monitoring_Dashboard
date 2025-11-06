const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Get aggregated KPI metrics
 * GET /api/analytics/kpis
 * Query params: workerId, startDate, endDate
 */
exports.getKPIs = async (req, res) => {
  try {
    const { workerId, startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Build match conditions
    const matchConditions = {};
    if (Object.keys(dateFilter).length > 0) {
      matchConditions.createdAt = dateFilter;
    }
    if (workerId) {
      matchConditions.assigned_to = workerId;
    }

    // Total orders created
    const totalOrders = await Order.countDocuments(matchConditions);

    // Total orders completed
    const completedOrders = await Order.countDocuments({
      ...matchConditions,
      status: 'completed'
    });

    // Calculate average production time (in hours)
    const productionTimeAgg = await Order.aggregate([
      {
        $match: {
          ...matchConditions,
          status: 'completed',
          start_date: { $exists: true },
          end_date: { $exists: true }
        }
      },
      {
        $project: {
          productionTime: {
            $divide: [
              { $subtract: ['$end_date', '$start_date'] },
              1000 * 60 * 60 // Convert milliseconds to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgProductionTime: { $avg: '$productionTime' }
        }
      }
    ]);

    const avgProductionTime = productionTimeAgg.length > 0 
      ? productionTimeAgg[0].avgProductionTime 
      : 0;

    // Completion rate
    const completionRate = totalOrders > 0 
      ? ((completedOrders / totalOrders) * 100).toFixed(2)
      : 0;

    // Worker completion percentages
    let workerStats = [];
    if (!workerId) {
      workerStats = await Order.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$assigned_to',
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'worker'
          }
        },
        { $unwind: { path: '$worker', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            workerId: '$_id',
            workerName: { $ifNull: ['$worker.username', 'Unassigned'] },
            totalOrders: 1,
            completedOrders: 1,
            completionRate: {
              $cond: [
                { $gt: ['$totalOrders', 0] },
                { $multiply: [{ $divide: ['$completedOrders', '$totalOrders'] }, 100] },
                0
              ]
            }
          }
        },
        { $sort: { completionRate: -1 } }
      ]);
    }

    // Delayed orders (deadline passed but not completed)
    const delayedOrders = await Order.countDocuments({
      ...matchConditions,
      status: { $ne: 'completed' },
      deadline: { $lt: new Date() }
    });

    // Orders by status
    const statusBreakdown = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        avgProductionTime: parseFloat(avgProductionTime.toFixed(2)),
        completionRate: parseFloat(completionRate),
        delayedOrders,
        statusBreakdown: statusBreakdown.map(s => ({
          status: s._id,
          count: s.count
        })),
        workerStats: workerStats.map(w => ({
          workerId: w.workerId,
          workerName: w.workerName,
          totalOrders: w.totalOrders,
          completedOrders: w.completedOrders,
          completionRate: parseFloat(w.completionRate.toFixed(2))
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KPI metrics'
    });
  }
};

/**
 * Get order volume over time
 * GET /api/analytics/order-volume
 * Query params: timeInterval (day|week|month), workerId, startDate, endDate
 */
exports.getOrderVolume = async (req, res) => {
  try {
    const { timeInterval = 'day', workerId, startDate, endDate } = req.query;

    // Default to last 30 days if no date range specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build match conditions
    const matchConditions = {
      createdAt: { $gte: start, $lte: end }
    };
    if (workerId) {
      matchConditions.assigned_to = workerId;
    }

    // Define date grouping format based on interval
    let dateGroupFormat;
    switch (timeInterval) {
      case 'week':
        dateGroupFormat = { 
          year: { $year: '$createdAt' }, 
          week: { $week: '$createdAt' } 
        };
        break;
      case 'month':
        dateGroupFormat = { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' } 
        };
        break;
      default: // day
        dateGroupFormat = { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' }, 
          day: { $dayOfMonth: '$createdAt' } 
        };
    }

    const volumeData = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: dateGroupFormat,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Format the data for frontend
    const formattedData = volumeData.map(item => {
      let label;
      if (timeInterval === 'week') {
        label = `Week ${item._id.week}, ${item._id.year}`;
      } else if (timeInterval === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      } else {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      }

      return {
        date: label,
        totalOrders: item.totalOrders,
        completedOrders: item.completedOrders,
        pendingOrders: item.pendingOrders,
        inProgressOrders: item.inProgressOrders
      };
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching order volume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order volume data'
    });
  }
};

/**
 * Get order status distribution
 * GET /api/analytics/status-distribution
 * Query params: workerId, startDate, endDate
 */
exports.getStatusDistribution = async (req, res) => {
  try {
    const { workerId, startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Build match conditions
    const matchConditions = {};
    if (Object.keys(dateFilter).length > 0) {
      matchConditions.createdAt = dateFilter;
    }
    if (workerId) {
      matchConditions.assigned_to = workerId;
    }

    const distribution = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate total for percentage
    const total = distribution.reduce((sum, item) => sum + item.count, 0);

    const formattedData = distribution.map(item => ({
      status: item.status,
      count: item.count,
      percentage: total > 0 ? parseFloat(((item.count / total) * 100).toFixed(2)) : 0
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status distribution'
    });
  }
};

/**
 * Get worker productivity metrics
 * GET /api/analytics/worker-productivity
 * Query params: startDate, endDate
 */
exports.getWorkerProductivity = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Build match conditions
    const matchConditions = {};
    if (Object.keys(dateFilter).length > 0) {
      matchConditions.createdAt = dateFilter;
    }

    const productivity = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$assigned_to',
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          blockedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      { $unwind: { path: '$worker', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          workerId: '$_id',
          workerName: { $ifNull: ['$worker.username', 'Unassigned'] },
          workerEmail: { $ifNull: ['$worker.email', 'N/A'] },
          totalOrders: 1,
          completedOrders: 1,
          inProgressOrders: 1,
          pendingOrders: 1,
          blockedOrders: 1,
          cancelledOrders: 1,
          completionRate: {
            $cond: [
              { $gt: ['$totalOrders', 0] },
              { $multiply: [{ $divide: ['$completedOrders', '$totalOrders'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { completedOrders: -1 } }
    ]);

    const formattedData = productivity.map(worker => ({
      workerId: worker.workerId,
      workerName: worker.workerName,
      workerEmail: worker.workerEmail,
      totalOrders: worker.totalOrders,
      completedOrders: worker.completedOrders,
      inProgressOrders: worker.inProgressOrders,
      pendingOrders: worker.pendingOrders,
      blockedOrders: worker.blockedOrders,
      cancelledOrders: worker.cancelledOrders,
      completionRate: parseFloat(worker.completionRate.toFixed(2))
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching worker productivity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch worker productivity data'
    });
  }
};
