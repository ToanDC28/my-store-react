import { ReactNode, useEffect } from "react";
import useAuthStore from "@/store/auth/useAuthStore";
import { Navigate, useLocation } from "react-router-dom";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      await checkAuth();
    }
    check();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return <>{children}</>;
}

export default AuthProvider;