'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ScaleIn } from './animations';
import { MdTrendingUp, MdPieChart, MdBarChart } from 'react-icons/md';
import type { OrderVolumeData, StatusDistributionData, WorkerProductivityData } from '@/lib/analyticsService';

interface OrderVolumeChartProps {
  data: OrderVolumeData[];
  title?: string;
}

export function OrderVolumeChart({ data, title = 'Order Volume Over Time' }: OrderVolumeChartProps) {
  return (
    <ScaleIn delay={0.1}>
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <MdTrendingUp className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line 
              type="monotone" 
              dataKey="totalOrders" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Total Orders"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="completedOrders" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Completed"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="inProgressOrders" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="In Progress"
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="pendingOrders" 
              stroke="#6b7280" 
              strokeWidth={2}
              name="Pending"
              dot={{ fill: '#6b7280', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ScaleIn>
  );
}

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  in_progress: '#3b82f6',
  completed: '#10b981',
  blocked: '#ef4444',
  cancelled: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

export function StatusDistributionChart({ data, title = 'Order Status Distribution' }: StatusDistributionChartProps) {
  const chartData = data.map(item => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
    fill: STATUS_COLORS[item.status] || '#6b7280',
  }));

  return (
    <ScaleIn delay={0.2}>
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <MdPieChart className="text-2xl text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ScaleIn>
  );
}

interface WorkerProductivityChartProps {
  data: WorkerProductivityData[];
  title?: string;
}

export function WorkerProductivityChart({ data, title = 'Worker Productivity' }: WorkerProductivityChartProps) {
  // Limit to top 10 workers by completed orders
  const topWorkers = [...data]
    .sort((a, b) => b.completedOrders - a.completedOrders)
    .slice(0, 10);

  return (
    <ScaleIn delay={0.3}>
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <MdBarChart className="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={topWorkers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="workerName" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Bar dataKey="completedOrders" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
            <Bar dataKey="inProgressOrders" fill="#f59e0b" name="In Progress" radius={[8, 8, 0, 0]} />
            <Bar dataKey="pendingOrders" fill="#6b7280" name="Pending" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ScaleIn>
  );
}
