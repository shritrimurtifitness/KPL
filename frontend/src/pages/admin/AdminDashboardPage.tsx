import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldAlert,
  Calendar,
  Download,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setExporting(format);
    try {
      const response = await api.get(`/admin/export?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cricket_registrations_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const occupied = (stats?.confirmed_registrations || 0) + (stats?.pending_verifications || 0) + (stats?.active_reservations || 0);
  const maxCap = stats?.maximum_capacity || 120;
  const percentage = Math.min(100, Math.round((occupied / maxCap) * 100));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Tournament Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time capacity tracking, payment verification queue & financial summary
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            {exporting === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className="inline-flex items-center space-x-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 disabled:opacity-50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Confirmed Registrations */}
        <div className="bg-[#131B2E] border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Confirmed Players
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-mono">
              {stats?.confirmed_registrations || 0}
            </span>
            <span className="text-xs text-slate-400">/ {maxCap} slots</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${Math.round(((stats?.confirmed_registrations || 0) / maxCap) * 100)}%` }}
            />
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-[#131B2E] border border-amber-900/40 p-6 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400 font-mono">
              {stats?.pending_verifications || 0}
            </span>
            {stats && stats.pending_verifications > 0 && (
              <Link
                to="/admin/payments"
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center"
              >
                <span>Verify Now</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Payment proofs awaiting admin review
          </p>
        </div>

        {/* Verified Collection */}
        <div className="bg-[#131B2E] border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Verified Collection
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-teal-300 font-mono">
              ₹{stats?.total_verified_collection || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Only approved & confirmed payments
          </p>
        </div>

        {/* Available Slots */}
        <div className="bg-[#131B2E] border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available Slots
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-cyan-300 font-mono">
              {stats?.available_slots || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {stats?.registration_open ? 'Registration is OPEN' : 'Registration is CLOSED'}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-medium">Active 15m Reservations</span>
            <p className="text-2xl font-bold text-white mt-0.5 font-mono">
              {stats?.active_reservations || 0}
            </p>
          </div>
          <span className="text-xs text-slate-500">Hold window</span>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-medium">Rejected Registrations</span>
            <p className="text-2xl font-bold text-rose-400 mt-0.5 font-mono">
              {stats?.rejected_registrations || 0}
            </p>
          </div>
          <span className="text-xs text-slate-500">Slots freed</span>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-medium">Expired Reservations</span>
            <p className="text-2xl font-bold text-slate-400 mt-0.5 font-mono">
              {stats?.expired_registrations || 0}
            </p>
          </div>
          <span className="text-xs text-slate-500">Auto-released</span>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="bg-[#131B2E] border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payment Verification Queue</h3>
              <p className="text-xs text-slate-400">Review pending screenshots & match UTR bank records</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            There are currently <span className="font-bold text-amber-400">{stats?.pending_verifications || 0}</span> players waiting for verification.
          </p>
          <Link
            to="/admin/payments"
            className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-transform hover:scale-[1.02]"
          >
            <span>Open Verification Queue</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-[#131B2E] border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">All Tournament Registrations</h3>
              <p className="text-xs text-slate-400">Filter, search, view player profiles & export data</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Total active slot occupancy is at <span className="font-bold text-emerald-400">{occupied}</span> of {maxCap} maximum players.
          </p>
          <Link
            to="/admin/registrations"
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-700 transition-transform hover:scale-[1.02]"
          >
            <span>Browse Registrations Table</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
