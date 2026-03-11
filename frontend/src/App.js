import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function AppRouter() {
  const { user } = useAuth();
  if (!user) return <Login />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <EmployeeDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
