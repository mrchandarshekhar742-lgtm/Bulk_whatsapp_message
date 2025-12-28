import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ExcelPage from './pages/ExcelPage';
import DevicesPage from './pages/DevicesPage';
import CreateCampaignPage from './pages/CreateCampaignPage';
import CampaignLogsPage from './pages/CampaignLogsPage';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/excel"
            element={
              <ProtectedRoute>
                <ExcelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <ProtectedRoute>
                <DevicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-campaign"
            element={
              <ProtectedRoute>
                <CreateCampaignPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <CampaignLogsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
