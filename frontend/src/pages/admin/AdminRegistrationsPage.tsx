import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  CreditCard,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { resolveMediaUrl } from '../../utils/media';

export const AdminRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail Modal
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Export state
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/admin/registrations', { params });
      setRegistrations(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRegistrations();
  };

  const handleOpenDetail = async (id: string) => {
    setModalLoading(true);
    try {
      const res = await api.get(`/admin/registrations/${id}`);
      setSelectedReg(res.data);
    } catch (err) {
      alert('Failed to load registration details.');
    } finally {
      setModalLoading(false);
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
      link.setAttribute('download', `registrations_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export.');
    } finally {
      setExporting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'PAYMENT_SUBMITTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Clock className="w-3 h-3" />
            <span>PAYMENT SUBMITTED</span>
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <CreditCard className="w-3 h-3" />
            <span>RESERVED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3 h-3" />
            <span>REJECTED</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700/60 text-slate-400 border border-slate-600">
            <AlertTriangle className="w-3 h-3" />
            <span>EXPIRED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Registrations Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, inspect profiles, and contact players
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            {exporting === 'csv' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className="inline-flex items-center space-x-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'CONFIRMED', 'PAYMENT_SUBMITTED', 'RESERVED', 'REJECTED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === s
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s === 'ALL' ? 'All Records' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ID, name, mobile, UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Registrations Container (Desktop Table + Mobile Cards) */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Registration ID</th>
                <th className="py-4 px-6">Player Name</th>
                <th className="py-4 px-6">Mobile</th>
                <th className="py-4 px-6">Role & City</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">UTR</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>Loading player registrations...</span>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No registrations found matching the criteria.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const latestPay = reg.payments?.[0];
                  return (
                    <tr key={reg.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                        {reg.registration_id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {reg.photo_url ? (
                            <img
                              src={resolveMediaUrl(reg.photo_url)}
                              alt={reg.full_name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-semibold text-white">{reg.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300">
                        {reg.mobile}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-white block font-medium">{reg.cricket_role}</span>
                        <span className="text-[11px] text-slate-400">{reg.city}</span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(reg.status)}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300 truncate max-w-[140px]">
                        {latestPay?.utr || '—'}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenDetail(reg.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://wa.me/91${reg.mobile.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${reg.full_name}, regarding your tournament registration ${reg.registration_id}:`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg inline-block transition-colors"
                          title="Contact on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Visible on screens < md) */}
        <div className="block md:hidden divide-y divide-slate-800/80">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
              <span>Loading player registrations...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-16 text-center text-slate-500 px-4">
              No registrations found matching the criteria.
            </div>
          ) : (
            registrations.map((reg) => {
              const latestPay = reg.payments?.[0];
              return (
                <div key={reg.id} className="p-4 space-y-3 hover:bg-slate-800/20 transition-colors">
                  {/* Header: Avatar, Name, Reg ID, and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      {reg.photo_url ? (
                        <img
                          src={resolveMediaUrl(reg.photo_url)}
                          alt={reg.full_name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{reg.full_name}</h4>
                        <span className="font-mono text-xs font-bold text-emerald-400 block">
                          {reg.registration_id}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(reg.status)}</div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#0B0F19] p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Role & City
                      </span>
                      <span className="text-white font-medium truncate block">
                        {reg.cricket_role} • {reg.city}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Mobile
                      </span>
                      <span className="font-mono text-slate-200 block">{reg.mobile}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        UTR Reference:
                      </span>
                      <span className="font-mono font-semibold text-cyan-400 text-xs">
                        {latestPay?.utr || 'Not submitted'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenDetail(reg.id)}
                      className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Profile</span>
                    </button>
                    <a
                      href={`https://wa.me/91${reg.mobile.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${reg.full_name}, regarding your tournament registration ${reg.registration_id}:`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {registrations.length} of {total} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Registration Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#131B2E] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-4">
                {selectedReg.photo_url ? (
                  <img
                    src={resolveMediaUrl(selectedReg.photo_url)}
                    alt={selectedReg.full_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40 bg-slate-800 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Player Profile</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{selectedReg.full_name}</h3>
                  <span className="font-mono text-emerald-400 text-xs font-bold">
                    {selectedReg.registration_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Mobile Number</span>
                <span className="text-white font-mono font-semibold mt-1 block">
                  {selectedReg.mobile}
                </span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Email</span>
                <span className="text-white font-semibold mt-1 block truncate">
                  {selectedReg.email || 'N/A'}
                </span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Age</span>
                <span className="text-white font-semibold mt-1 block">{selectedReg.age} yrs</span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">City</span>
                <span className="text-white font-semibold mt-1 block">{selectedReg.city}</span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Cricket Role</span>
                <span className="text-white font-semibold mt-1 block">
                  {selectedReg.cricket_role}
                </span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Batting Style</span>
                <span className="text-white font-semibold mt-1 block">
                  {selectedReg.batting_style || 'N/A'}
                </span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Bowling Style</span>
                <span className="text-white font-semibold mt-1 block">
                  {selectedReg.bowling_style || 'N/A'}
                </span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Team Name</span>
                <span className="text-white font-semibold mt-1 block">
                  {selectedReg.team_name || 'Individual'}
                </span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Emergency Contact</span>
                <span className="text-white font-mono mt-1 block">
                  {selectedReg.emergency_contact || 'N/A'}
                </span>
              </div>
            </div>

            {/* Payment Submissions List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase font-bold text-slate-400">Associated Payment Proofs</h4>
              {selectedReg.payments && selectedReg.payments.length > 0 ? (
                <div className="space-y-2">
                  {selectedReg.payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-white block">UTR: {p.utr}</span>
                        <span className="text-[11px] text-slate-500">
                          Amount: ₹{p.amount} | Status: {p.status}
                        </span>
                        {p.rejection_reason && (
                          <span className="text-rose-400 block text-[11px] mt-0.5">
                            Rejection: {p.rejection_reason}
                          </span>
                        )}
                      </div>
                      <a
                        href={resolveMediaUrl((p as any).screenshot_url || `/api/v1/admin/payments/${p.id}/screenshot`)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                      >
                        <span>View Screenshot</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No payment proof uploaded yet.</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReg(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
