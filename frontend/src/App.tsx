import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/public/LandingPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { PaymentPage } from './pages/public/PaymentPage';
import { StatusLookupPage } from './pages/public/StatusLookupPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';
import { AdminPendingPaymentsPage } from './pages/admin/AdminPendingPaymentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { api } from './services/api';
import { LeagueSettings } from './types';

// Public layout wrapper with Navbar & Footer
const PublicLayout: React.FC<{ settings: LeagueSettings | null }> = ({ settings }) => (
  <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
    <Navbar
      leagueName={settings?.league_name}
      tournamentTitle={settings?.tournament_title}
    />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer
      leagueName={settings?.league_name}
      whatsappNumber={settings?.whatsapp_number}
    />
  </div>
);

export const App: React.FC = () => {
  const [settings, setSettings] = useState<LeagueSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/league/settings/public');
        setSettings(res.data);
      } catch (err) {
        console.error('Could not load public settings', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portal Routes */}
          <Route element={<PublicLayout settings={settings} />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/status" element={<StatusLookupPage />} />
          </Route>

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Console Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="registrations" element={<AdminRegistrationsPage />} />
            <Route path="payments" element={<AdminPendingPaymentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
