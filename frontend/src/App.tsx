import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QueryClientProvider } from './contexts/QueryClientContext';
import Sidebar from './components/layout/sidebar/Sidebar';
import Login from './components/pages/auth/Login';
import Dashboard from './components/pages/dashboard/Dashboard';
import Products from './components/pages/products/Products';
import Loading from './components/ui/Loading';

// Protected route component
interface PrivateRouteProps {
  children: React.ReactElement;
  requiredPermission?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredPermission = '' }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    // Save the requested URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a permission is required, check it
  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout component with sidebar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300 ml-0 lg:ml-64">
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 z-30 w-full bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button className="lg:hidden mr-4 text-gray-500 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Signed in as</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">User</span>
                  <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 011.414 1.414l-4 4a1 1 001.414 1.414l4-4a1 1 001.414-1.414l-4-4a1 1 001.414-1.414zM5 10a1 1 010 2H3.5A1.5 1.5 0 012 10.5V9.5A1.5 1.5 0 013.5 8H5zm0 2a1 1 010 2H3.5A1.5 1.5 0 0112.5 11.5V10.5A1.5 1.5 0 0111 9H9zm0 2a1 1 010 2H3.5A1.5 1.5 0 0110.5 13.5V12.5A1.5 1.5 0 019 11H7z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes within AppLayout */}
              <Route
                path="/"
                element={
                  <AppLayout>
                    <PrivateRoute requiredPermission="dashboard:read">
                      <Dashboard />
                    </PrivateRoute>
                  </AppLayout>
                }
              />
              <Route
                path="/products"
                element={
                  <AppLayout>
                    <PrivateRoute requiredPermission="product:read">
                      <Products />
                    </PrivateRoute>
                  </AppLayout>
                }
              />
            </Routes>
          </Suspense>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;