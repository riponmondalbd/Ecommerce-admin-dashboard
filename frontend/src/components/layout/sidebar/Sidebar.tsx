import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';

const MenuItem = ({ icon, text, href, requiredPermission, hasPermission }: {
  icon: string;
  text: string;
  href: string;
  requiredPermission?: string;
  hasPermission?: boolean;
}) => {
  const isActive = useLocation().pathname === href;

  if (!hasPermission && requiredPermission !== undefined) return null;

  return (
    <Link
      to={href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
        isActive
          ? 'bg-indigo-60 text-indigo-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {text}
    </Link>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when window is resized to desktop width
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar - Fixed on desktop, slides in from left on mobile */}
      <div
        className={`fixed lg:static lg:inset-y-0 lg:left-0 lg:w-64 lg:z-30 lg:flex-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }
        bg-white border-r border-gray-200 w-64 h-full overflow-y-auto transition-transform duration-300 ease-in-out z-40 lg:z-40">

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

      {/* Content area with margin for mobile sidebar */}
      <div
        className={`lg:ml-0 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-64' : ''
        } lg:translate-x-0`}
      >
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 z-30 w-full bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  className="lg:hidden mr-4 text-gray-500 hover:text-gray-600 focus:outline-none"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 hidden sm:block">Signed in as</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 hidden sm:inline">{user.name}</span>
                  <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 011.414 1.414l-4 4a1 1 001.414 1.414l4-4a1 1 001.414-1.414l-4-4a1 1 001.414-1.414zM5 10a1 1 010 2H3.5A1.5 1.5 0 011 10.5V9.5A1.5 1.5 0 013.5 8H5zm0 2a1 1 010 2H3.5A1.5 1.5 0 0112.5 11.5V10.5A1.5 1.5 0 0111 9H9zm0 2a1 1 010 2H3.5A1.5 1.5 0 0110 13.5V12.5A1.5 1.5 0 019 11H7z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - adjusted for header height */}
        <main className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/** Children content will render here */}
        </main>
      </div>
    </>
  );
};

export default Sidebar;