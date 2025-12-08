import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';

export default function DashboardLayout({ children, title }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 transition-all duration-300 w-full">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 ml-4">
              <span className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap">
                📅 {today}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
