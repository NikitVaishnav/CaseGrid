import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import TimelinePage from './pages/TimelinePage';
import AuditLogsPage from './pages/AuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes — all authenticated users */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
              </Route>

              {/* Protected routes — upload restricted to IO, LO, Admin */}
              <Route element={<ProtectedRoute allowedRoles={['INVESTIGATING_OFFICER', 'LEGAL_OFFICER', 'ADMIN']} />}>
                <Route path="/upload" element={<UploadPage />} />
              </Route>

              {/* Protected routes — audit logs restricted to Admin & Judge */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'JUDGE']} />}>
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
