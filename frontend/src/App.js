import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Register from './pages/RegisterNew';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import '@/App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
