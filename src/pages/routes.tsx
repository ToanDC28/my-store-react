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
import WorkOrdersPage from './workorders/WorkOrdersPage';
import WorkOrderDetailPage from './workorders/WorkOrderDetailPage';
import SalesOrdersPage from './sales/SalesOrdersPage';
import SalesOrderDetailPage from './sales/SalesOrderDetailPage';
import GoodsIssuesPage from './sales/GoodsIssuesPage';
import CustomersPage from './customers/CustomersPage';
import InvoicesPage from './invoices/InvoicesPage';
import InvoiceDetailPage from './invoices/InvoiceDetailPage';
import PaymentsPage from './payments/PaymentsPage';
import PayrollsPage from './payrolls/PayrollsPage';
import LeavesPage from './payrolls/LeavesPage';

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
      {
        path: 'work-orders',
        element: <WorkOrdersPage />,
        breadcrumb: { label: 'Sửa chữa', href: '/work-orders' },
      },
      {
        path: 'work-orders/:id',
        element: <WorkOrderDetailPage />,
        breadcrumb: { label: 'Chi tiết đơn', href: '/work-orders' },
      },
      {
        path: 'sales',
        element: <SalesOrdersPage />,
        breadcrumb: { label: 'Bán hàng', href: '/sales' },
      },
      {
        path: 'sales/:id',
        element: <SalesOrderDetailPage />,
        breadcrumb: { label: 'Chi tiết đơn bán', href: '/sales' },
      },
      {
        path: 'goods-issues',
        element: <GoodsIssuesPage />,
        breadcrumb: { label: 'Phiếu xuất', href: '/goods-issues' },
      },
      {
        path: 'customers',
        element: <CustomersPage />,
        breadcrumb: { label: 'Khách hàng', href: '/customers' },
      },
      {
        path: 'invoices',
        element: <InvoicesPage />,
        breadcrumb: { label: 'Hóa đơn', href: '/invoices' },
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetailPage />,
        breadcrumb: { label: 'Chi tiết HĐ', href: '/invoices' },
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
        breadcrumb: { label: 'Thu chi', href: '/payments' },
      },
      {
        path: 'payrolls',
        element: <PayrollsPage />,
        breadcrumb: { label: 'Lương', href: '/payrolls' },
      },
      {
        path: 'leaves',
        element: <LeavesPage />,
        breadcrumb: { label: 'Chấm nghỉ', href: '/leaves' },
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