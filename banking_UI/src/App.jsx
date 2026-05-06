import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './hooks/useAppDispatch';
import { NavigationBar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Auth Pages
import { LandingPage } from './pages/auth/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { KYCVerification } from './pages/auth/KYCVerification';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Customer Pages
import { Dashboard } from './pages/customer/Dashboard';
import { AccountsList } from './pages/customer/AccountsList';
import { TransactionHistory } from './pages/customer/TransactionHistory';
import { TransferFunds } from './pages/customer/TransferFunds';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AuditLogs } from './pages/admin/AuditLogs';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null, requireKYC = false }) => {
  const { isAuthenticated, kycVerified, role } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" />;
  }

  if (requireKYC && !kycVerified) {
    return <Navigate to="/kyc-verify" />;
  }

  return children;
};

// Layout Component
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className="app-layout">
      <NavigationBar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, token, role } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if token exists in localStorage on app load
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && !token) {
      // You might want to validate the token here
    }
  }, [token, dispatch]);

  return (
    <AppLayout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* KYC Verification (requires auth) */}
        <Route
          path="/kyc-verify"
          element={
            <ProtectedRoute>
              <KYCVerification />
            </ProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="customer" requireKYC={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute requiredRole="customer" requireKYC={true}>
              <AccountsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute requiredRole="customer" requireKYC={true}>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfer"
          element={
            <ProtectedRoute requiredRole="customer" requireKYC={true}>
              <TransferFunds />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute requiredRole="admin">
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Catch All - Redirect based on auth status and role */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </AppLayout>
  );
}

export default App;

