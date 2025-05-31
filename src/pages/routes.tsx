import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import Dashboard from './Dashboard';
import ProtectedLayout from '@/layout/ProtectedLayout';
import useAuthStore from '@/store/auth/useAuthStore';
import { Breadcrumb } from '@/context/BreadcrumbContext';
import { ProductBoard } from './products/ProductBoard';
import ForgotPasswordPage from './auth/ForgotPassword';

// Define route configuration with breadcrumbs
const routes: Array<{
  path: string;
  element: React.ReactNode;
  breadcrumb?: Breadcrumb;
  children?: Array<{
    path: string;
    element: React.ReactNode;
    breadcrumb?: Breadcrumb;
  }>;
}> = [
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    breadcrumb: { label: 'Forgot password', href: '/forgot-password' },
  },
  {
    path: '/login',
    element: <Login />,
    breadcrumb: { label: 'Login', href: '/login' },
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
        breadcrumb: { label: 'Dashboard', href: '/dashboard' },
      },
      {
        path: 'products',
        element: <ProductBoard />,
        breadcrumb: { label: 'Products', href: '/products' },
      },
      // Add more protected routes here with their breadcrumbs
    ],
  },
];

// Convert route configuration to router configuration
const router = createBrowserRouter(
  routes.map(({ breadcrumb: _breadcrumb, children, ...route }) => ({
    ...route,
    children: children?.map(({ breadcrumb: _childBreadcrumb, ...child }) => child),
  }))
);

function RootRedirect() {
  const { isAuthenticated } = useAuthStore();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export { routes };
export default router; 