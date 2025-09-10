import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that redirects authenticated users away from certain pages
 * @param children - The component to render if user is not authenticated
 * @param redirectTo - The path to redirect to if user is authenticated (defaults to '/dashboard')
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { token } = useAuth();

  // If user is logged in, redirect them to the specified route
  if (token) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user is not logged in, render the children (e.g., Landing page)
  return <>{children}</>;
};

export default ProtectedRoute;
