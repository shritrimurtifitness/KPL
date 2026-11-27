import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  Menu,
  X,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/admin/payments/pending');
      setPendingCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400">
        Loading admin console...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Registrations', path: '/admin/registrations', icon: Users },
    { label: 'Payment Verification', path: '/admin/payments', icon: CheckCircle },
    { label: 'League Settings', path: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0F172A] border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="font-bold text-white text-base font-display block leading-tight">
              Admin Console
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Cricket Ops
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isPayments = item.path === '/admin/payments';
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {isPayments && pendingCount > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-mono font-bold rounded-full shrink-0 transition-colors ${
                      active
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-rose-500 text-white shadow-sm shadow-rose-950/60 animate-pulse'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer / Links */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <span>Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between px-2">
            <div className="truncate pr-2">
              <span className="text-xs font-semibold text-white block truncate">
                {user?.full_name || 'Admin'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate font-mono">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar for Mobile & Header */}
        <header className="h-16 lg:h-20 bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0F172A] animate-pulse" />
              )}
            </button>
            <span className="font-bold text-white text-base">Admin Console</span>
          </div>

          <div className="hidden lg:block text-xs text-slate-400">
            Cricket League Management & Concurrency Slot Control Engine
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {user?.role || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col z-10">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <span className="font-bold text-white text-base">Admin Console</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-4 px-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const isPayments = item.path === '/admin/payments';
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {isPayments && pendingCount > 0 && (
                        <span
                          className={`ml-2 px-2.5 py-0.5 text-xs font-mono font-bold rounded-full shrink-0 ${
                            active
                              ? 'bg-slate-950 text-amber-400'
                              : 'bg-rose-500 text-white shadow-sm shadow-rose-950/60 animate-pulse'
                          }`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-800 space-y-2">
                <Link
                  to="/"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg"
                >
                  <span>Public Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
