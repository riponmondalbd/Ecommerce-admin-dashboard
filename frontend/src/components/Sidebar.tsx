'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

// Simple icon components using SVG (you could replace with Lucide React)
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-z"/></svg>;
const ProductsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.627.627-.004 1.683.627 1.683h4.39"/></svg>;
const CategoriesIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.346M14 4.654a2 2 0 01-2.83-2.83m-8.414 11.828l-1.016 2.04a2 2 0 00 .831 2.697 2 2 0 002.83-.83l.815-1.64"/></svg>;
const BrandsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
const AttributesIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>;
const MediaIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const RolesIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const PermissionsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;

import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = () => any;

interface MenuItem {
  label: string;
  href: string;
  requiresPermission?: string[];
  icon?: IconComponent;
}

export default function Sidebar() {
  const { user, getUser } = useAuthStore();
  const [permissions, setPermissions] = useState<string[]>([]);

  // Fetch user data on mount
  useEffect(() => {
    getUser().then(u => {
      if (u && u.permissions) {
        setPermissions(u.permissions);
      }
    });
  }, [getUser]);

  // Menu items configuration - only show based on permissions
  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      requiresPermission: [],
      icon: DashboardIcon,
    },
    {
      label: 'Products',
      href: '/dashboard/products',
      requiresPermission: ['product:read'],
      icon: ProductsIcon,
    },
    {
      label: 'Categories',
      href: '/dashboard/categories',
      requiresPermission: ['category:read'],
      icon: CategoriesIcon,
    },
    {
      label: 'Brands',
      href: '/dashboard/brands',
      requiresPermission: ['brand:read'],
      icon: BrandsIcon,
    },
    {
      label: 'Attributes',
      href: '/dashboard/attributes',
      requiresPermission: ['attribute:read'],
      icon: AttributesIcon,
    },
    {
      label: 'Media',
      href: '/dashboard/media',
      requiresPermission: ['media:read'],
      icon: MediaIcon,
    },
    {
      label: 'Users',
      href: '/dashboard/users',
      requiresPermission: ['user:read'],
      icon: UsersIcon,
    },
    {
      label: 'Roles',
      href: '/dashboard/roles',
      requiresPermission: ['role:read'],
      icon: RolesIcon,
    },
    {
      label: 'Permissions',
      href: '/dashboard/permissions',
      requiresPermission: ['permission:read'],
      icon: PermissionsIcon,
    },
  ];

  // Filter menu items based on user permissions
  const visibleItems = menuItems.filter(item => {
    if (!item.requiresPermission || item.requiresPermission.length === 0) {
      return true;
    }
    return item.requiresPermission.some(perm => permissions.includes(perm));
  });

  if (!user) {
    // Loading state
    return (
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r z-40 flex flex-col">
        <div className="p-4 font-bold text-lg text-gray-900">Loading...</div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r z-40 flex flex-col">
      {/* Brand / Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2 font-bold text-lg text-gray-900">
          <DashboardIcon />
          <span>Trends Bird</span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
          <p className="text-xs text-primary mt-2">Role: {user.role?.name || 'N/A'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-gray-100"
          >
            <span className="mr-3 text-gray-600">{item.icon ? <item.icon /> : null}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t">
        <Link
          href="/logout"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m-4 0v-3m-9 3H6a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-1" />
          </svg>
          Sign out
        </Link>
      </div>
    </aside>
  );
}
