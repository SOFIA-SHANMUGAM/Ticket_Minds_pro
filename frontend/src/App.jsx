import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ClientDashboard from './pages/ClientDashboard';
import EngineerDashboard from './pages/EngineerDashboard';

// Route Guard for logged in users
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex flex-col items-center justify-center text-discord-textMuted space-y-3">
        <svg className="animate-spin h-8 w-8 text-discord-blurple" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-semibold">Restoring session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'engineer' ? '/engineer' : '/client'} replace />;
  }

  return children;
};

// Redirect root to login or dashboard
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // let the PrivateRoute loading show

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'engineer' ? '/engineer' : '/client'} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      <Route 
        path="/client" 
        element={
          <PrivateRoute allowedRoles={['client']}>
            <ClientDashboard />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/engineer" 
        element={
          <PrivateRoute allowedRoles={['engineer']}>
            <EngineerDashboard />
          </PrivateRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
