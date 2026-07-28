import React from 'react';
import { FiSearch, Bell, User, FiLogOut } from 'react-icons/fi';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  user?: { name: string };
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, user, onLogout }) => (
  <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
    {/* Mobile menu toggle button */}
    <div className="flex items-center gap-4">
      {onMobileMenuToggle && (
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your store</p>
      </div>
    </div>

    {/* Right side actions */}
    <div className="flex items-center gap-4">
      {/* Search */}
      <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
        <FiSearch className="text-gray-400 mr-2" />
        <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm" />
      </div>

      {/* Notification bell */}
      <button className="p-2 rounded-lg hover:bg-gray-100 relative group">
        <Bell className="text-gray-600 w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full group-hover:scale-110 transition-transform"></span>
      </button>

      {/* User profile */}
      {user ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="text-gray-500 w-5 h-5" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            title="Logout"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Sign In
        </button>
      )}
    </div>
  </header>
);
