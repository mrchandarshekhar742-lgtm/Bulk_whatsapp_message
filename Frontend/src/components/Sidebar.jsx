import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDashboard, MdDescription, MdPerson, MdLogout, MdChevronRight, MdMenu, MdClose, MdPhoneAndroid, MdSend, MdHistory, MdUpload } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';

export function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { icon: MdDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MdPhoneAndroid, label: 'Devices', path: '/devices' },
    { icon: MdSend, label: 'Create Campaign', path: '/create-campaign' },
    { icon: MdHistory, label: 'Campaign Logs', path: '/logs' },
    { icon: MdUpload, label: 'Excel Upload', path: '/excel' },
    { icon: MdDescription, label: 'Templates', path: '/templates' },
    { icon: MdDescription, label: 'Campaigns', path: '/campaigns' },
    { icon: MdPerson, label: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  const closeMobileSidebar = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-gradient-to-b from-secondary-800 via-secondary-850 to-secondary-900 text-white fixed h-screen left-0 top-0 overflow-y-auto z-[70] shadow-xl transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 sm:p-6 border-b border-secondary-700/50 bg-gradient-to-r from-secondary-800 to-secondary-900">
          <Link to="/dashboard" className="flex items-center gap-3 group" onClick={closeMobileSidebar}>
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
              <MdDescription className="text-xl sm:text-2xl text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-white truncate">WhatsApp Pro</h1>
              <p className="text-xs text-secondary-400 truncate">Bulk Sender</p>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileSidebar}
            className="absolute top-4 right-4 lg:hidden p-2 hover:bg-secondary-700 rounded-lg transition-colors"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 sm:p-4 space-y-1 pb-32">
          <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider px-3 py-2">
            Menu
          </p>
          {menuItems.map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={closeMobileSidebar}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive(path)
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-secondary-300 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              <Icon className="text-lg sm:text-xl flex-shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{label}</span>
              {isActive(path) && <MdChevronRight className="text-lg flex-shrink-0" />}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-secondary-700/50 bg-secondary-900">
          {/* User Info */}
          <div className="mb-3 p-3 bg-secondary-700/40 rounded-lg border border-secondary-600/50">
            <p className="text-xs text-secondary-400 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">
              {user?.email || 'User'}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 rounded-lg bg-error-500/20 hover:bg-error-500/30 text-error-200 transition-all duration-200"
          >
            <MdLogout className="text-lg flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 lg:hidden z-[75] p-3 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-all duration-200"
      >
        <MdMenu className="text-xl" />
      </button>
    </>
  );
}
