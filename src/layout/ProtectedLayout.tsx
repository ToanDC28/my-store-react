import { Outlet } from 'react-router-dom';
import AuthProvider from '@/providers/AuthProvider';
import MainLayout from '@/layout/MainLayout';

const ProtectedLayout = () => {
  return (
    <AuthProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </AuthProvider>
  );
};

export default ProtectedLayout; 