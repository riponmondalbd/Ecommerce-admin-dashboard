import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiPackage, FiCategory, FiTag, FiImage, FiSettings, FiLogOut } from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard', path: '/', icon: FiHome },
  { name: 'Products', path: '/products', icon: FiPackage, permissions: ['product:read'] },
  { name: 'Categories', path: '/categories', icon: FiCategory, permissions: ['category:read'] },
  { name: 'Brands', path: '/brands', icon: FiSettings, permissions: ['brand:read'] },
  { name: 'Attributes', path: '/attributes', icon: FiTag, permissions: ['attribute:read'] },
  { name: 'Media', path: '/media', icon: FiImage, permissions: ['media:read'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name: string; email: string };
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter items based on user permissions (simplified - in real app, check actual permissions)
  const visibleNavItems = navItems; // All items visible for demo

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-gray-900 text-white shadow-xl transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:static md:shadow-none md:bg-inherit md:w-auto`}
      >
        {/* Sidebar header */}
        <div className="p-6 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-3 text-white hover:text-primary-300 transition-colors">
            <FiHome className="w-8 h-8" />
            <span className="text-xl font-bold">Trends Bird</span>
          </Link>
          <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
        </div>

        {/* User info if logged in */}
        {user && (
          <div className="p-6 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="py-4 px-2">
          <div className="space-y-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.permissions
                    ? 'text-gray-400 hover:bg-gray-800/50'
                    : `hover:bg-gray-800 ${item.path === '/' ? 'text-white' : 'text-gray-300'}`}
                }
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout button */}
        {user && (
          <button
            className="w-full p-4 text-left text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-3"
            onClick={() => {
              onClose();
              // In real app, call logout function
            }}
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        )}
      </aside>

      {/* Mobile menu toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        onClick={() => setIsMobileOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
};
