import { motion } from 'framer-motion';

export function StatCard({ icon: Icon, label, value, trend, color = 'primary' }) {
  const colorClasses = {
    primary: {
      bg: 'from-primary-50 to-primary-100 border-primary-200',
      icon: 'bg-primary-500 text-white',
      trend: 'text-primary-700',
    },
    success: {
      bg: 'from-success-50 to-success-100 border-success-200',
      icon: 'bg-success-500 text-white',
      trend: 'text-success-700',
    },
    warning: {
      bg: 'from-warning-50 to-warning-100 border-warning-200',
      icon: 'bg-warning-500 text-white',
      trend: 'text-warning-700',
    },
    error: {
      bg: 'from-error-50 to-error-100 border-error-200',
      icon: 'bg-error-500 text-white',
      trend: 'text-error-700',
    },
  };

  const config = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -4 }}
      className={`card-lg p-6 bg-gradient-to-br ${config.bg} border`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-secondary-600 text-sm font-semibold uppercase tracking-wide">{label}</p>
          <div className="flex items-baseline gap-3 mt-3">
            <p className="text-4xl font-bold text-secondary-900">{value}</p>
          </div>
          {trend && (
            <p className={`text-xs font-semibold mt-3 ${config.trend}`}>
              ↗ {trend}
            </p>
          )}
        </div>
        <div className={`${config.icon} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="text-2xl" />
        </div>
      </div>
    </motion.div>
  );
}
