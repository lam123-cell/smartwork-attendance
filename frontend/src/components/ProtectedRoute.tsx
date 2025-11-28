import React from 'react';
import { Navigate } from 'react-router-dom';

type Props = {
  children: React.ReactElement;
  allowedRoles?: string[];
};

function readStoredAuth() {
  try {
    const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const auth = readStoredAuth();
  const user = auth?.user ?? null;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // If allowedRoles provided, check membership
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect user to their dashboard based on role
      if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
      return <Navigate to="/employee-dashboard" replace />;
    }
  }

  return children;
}
