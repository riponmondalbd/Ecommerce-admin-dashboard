import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const MenuItem = ({ icon, text, href, requiredPermission, hasPermission }: {
  icon: string;
  text: string;
  href: string;
  requiredPermission?: string;
  hasPermission?: boolean;
}) => {
  const currentLocation = useLocation();
  const isActive = currentLocation.pathname === href;

  if (!hasPermission && requiredPermission !== undefined) return null;

  return (
    <Link
      to={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
        isActive
          ? 'bg-indigo-60 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {text}
    </Link>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const currentLocation = useLocation();

  // Show menu items based on user role and permissions
  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { icon: '📊', text: 'Dashboard', href: '/' },
      { icon: '📦', text: 'Products', href: '/products' },
      { icon: '🏷️', text: 'Categories', href: '/categories' },
      { icon: '🏭', text: 'Brands', href: '/brands' },
      { icon: '⚙️', text: 'Settings', href: '/settings' },
    ];

    // All users see dashboard and products by default
    const visibleItems = baseItems.filter(item => item.href === '/' || item.href === '/products');

    // Higher permission roles see additional items
    if (user.permissions.some(p => p.startsWith('category:') || p === 'category:*')) {
      visibleItems.push({ icon: '🏷️', text: 'Categories', href: '/categories' });
    }
    if (user.permissions.some(p => p.startsWith('brand:') || p === 'brand:*')) {
      visibleItems.push({ icon: '🏭', text: 'Brands', href: '/brands' });
    }

    return visibleItems;
  };

  if (!user) return null;

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 z-40 bg-white border-r border-gray-200 w-64 overflow-y-auto h-full transition-all duration-300 ease-in-out">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🛒</span>
          <span className="text-lg font-bold text-gray-900">Admin Panel</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Trends Bird Limited</p>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-1.5">
        {getMenuItems().map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            text={item.text}
            href={item.href}
          />
        ))}
      </nav>

      {/* User Info Section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold uppercase">
              {user.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;