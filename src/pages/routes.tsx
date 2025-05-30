import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import Dashboard from './Dashboard';
import useAuthStore from '@/store/auth/useAuthStore';
import AuthProvider from '@/providers/AuthProvider';
import MainLayout from '@/layout/MainLayout';
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <AuthProvider>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </AuthProvider>
    ),
  },
  // Add more routes here as needed
]);

// Component to handle root path redirection
function RootRedirect() {
  const { isAuthenticated } = useAuthStore();
  
  // If authenticated, redirect to dashboard, otherwise to login
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default router; 