import { ReactNode } from "react";
import useAuthStore from "@/store/auth/useAuthStore";
import { Navigate, useLocation } from "react-router-dom";

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    const token = localStorage.getItem('token');
    
    if(!token){
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if(token){
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshTokenExpiryTime = localStorage.getItem('refreshTokenExpiryTime');
        const exp = localStorage.getItem('exp');
        if(exp && parseInt(exp) < Date.now() / 1000){
            if(refreshToken && refreshTokenExpiryTime && Date.parse(refreshTokenExpiryTime) < Date.now()){
                logout();
                return <Navigate to="/login" state={{ from: location }} replace />;
            }
            if(refreshToken && refreshTokenExpiryTime && Date.parse(refreshTokenExpiryTime) >= Date.now()){
                logout();
                return <Navigate to="/login" state={{ from: location }} replace />;
            }
        }
        
    }
  }

  return <>{children}</>;
}

export default AuthProvider;