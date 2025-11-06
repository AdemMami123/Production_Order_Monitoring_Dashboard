'use client';

import { motion } from 'framer-motion';
import { ScaleIn, StaggerChildren } from './animations';
import {
  MdShoppingCart,
  MdCheckCircle,
  MdAccessTime,
  MdTrendingUp,
  MdWarning,
} from 'react-icons/md';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  delay?: number;
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'from-green-500 to-green-600',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconText: 'text-green-600 dark:text-green-400',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconText: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconText: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconText: 'text-red-600 dark:text-red-400',
  },
};

export function KPICard({ title, value, subtitle, icon, color, delay = 0 }: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <ScaleIn delay={delay}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {title}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${colors.iconBg}`}>
            <div className={`text-2xl ${colors.iconText}`}>{icon}</div>
          </div>
        </div>
        
        <div>
          <motion.h3
            className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
          >
            {value}
          </motion.h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </motion.div>
    </ScaleIn>
  );
}

interface KPISummaryProps {
  totalOrders: number;
  completedOrders: number;
  avgProductionTime: number;
  completionRate: number;
  delayedOrders: number;
}

export function KPISummary({
  totalOrders,
  completedOrders,
  avgProductionTime,
  completionRate,
  delayedOrders,
}: KPISummaryProps) {
  // Format production time
  const formatProductionTime = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = (hours / 24).toFixed(1);
    return `${days}d`;
  };

  return (
    <StaggerChildren staggerDelay={0.08}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          title="Total Orders"
          value={totalOrders}
          subtitle="All time"
          icon={<MdShoppingCart />}
          color="blue"
          delay={0}
        />
        
        <KPICard
          title="Completed"
          value={completedOrders}
          subtitle={`${totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(0) : 0}% of total`}
          icon={<MdCheckCircle />}
          color="green"
          delay={0.08}
        />
        
        <KPICard
          title="Avg Production Time"
          value={formatProductionTime(avgProductionTime)}
          subtitle="Per order"
          icon={<MdAccessTime />}
          color="purple"
          delay={0.16}
        />
        
        <KPICard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle="Overall efficiency"
          icon={<MdTrendingUp />}
          color="orange"
          delay={0.24}
        />
        
        <KPICard
          title="Delayed Orders"
          value={delayedOrders}
          subtitle="Past deadline"
          icon={<MdWarning />}
          color="red"
          delay={0.32}
        />
      </div>
    </StaggerChildren>
  );
}
