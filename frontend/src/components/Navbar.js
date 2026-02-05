import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplets, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from './ui/button';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav data-testid="main-navbar" className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2" data-testid="logo-link">
              <Droplets className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">FlowGuard</span>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                data-testid="dashboard-nav-link"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              {isAdmin() && (
                <Link
                  to="/admin"
                  data-testid="admin-nav-link"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700" data-testid="user-name">
              <span className="font-medium">{user?.name}</span>
              {user?.role === 'admin' && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Admin</span>
              )}
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              data-testid="logout-button"
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
