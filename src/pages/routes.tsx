import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import Dashboard from './Dashboard';
import ProtectedLayout from '@/layout/ProtectedLayout';
import useAuthStore from '@/store/auth/useAuthStore';
import { Breadcrumb } from '@/context/BreadcrumbContext';
import UserProfile from './personal/UserProfile';
import MaterialsPage from './materials/MaterialsPage';
import StocksPage from './inventory/StocksPage';
import QuickImportPage from './inventory/QuickImportPage';
import SuppliersPage from './suppliers/SuppliersPage';

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
    path: '/login',
    element: <Login />,
  },
  {
    path: '/user-profile',
    element: <UserProfile />,
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
        path: 'materials',
        element: <MaterialsPage />,
        breadcrumb: { label: 'Vật tư', href: '/materials' },
      },
      {
        path: 'stocks',
        element: <StocksPage />,
        breadcrumb: { label: 'Tồn kho', href: '/stocks' },
      },
      {
        path: 'quick-import',
        element: <QuickImportPage />,
        breadcrumb: { label: 'Nhập nhanh', href: '/quick-import' },
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
        breadcrumb: { label: 'Nhà cung cấp', href: '/suppliers' },
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