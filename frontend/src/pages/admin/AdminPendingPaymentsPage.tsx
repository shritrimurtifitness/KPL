import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  MessageCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Loader2,
  X,
  AlertCircle,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { PendingPaymentItem } from '../../types';

export const AdminPendingPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PendingPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected screenshot lightbox
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<PendingPaymentItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payments/pending');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    if (!window.confirm('Are you sure you have verified this UTR in your receiving bank account and wish to APPROVE this registration?')) {
      return;
    }

    setActionLoading(paymentId);
    try {
      await api.post(`/admin/payments/${paymentId}/approve`);
      // Remove from pending list
      setPayments((prev) => prev.filter((p) => p.payment_id !== paymentId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      alert('Please provide a specific rejection reason for the player.');
      return;
    }

    setActionLoading(rejectingItem.payment_id);
    try {
      await api.post(`/admin/payments/${rejectingItem.payment_id}/reject`, {
        reason: rejectReason.trim(),
      });
      setPayments((prev) => prev.filter((p) => p.payment_id !== rejectingItem.payment_id));
      setRejectingItem(null);
      setRejectReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject payment.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Payment Verification Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review player transaction screenshots, cross-verify UTR with bank records, and approve or reject slots
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Queue is Clear!</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            There are currently no pending payments awaiting verification. New submissions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((item) => (
            <div
              key={item.payment_id}
              className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                    {item.registration_id}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    ₹{item.amount}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {item.player_photo_url ? (
                    <img
                      src={item.player_photo_url}
                      alt={item.player_name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{item.player_name}</h3>
                    <span className="text-xs font-mono text-slate-400 block mt-0.5">{item.mobile}</span>
                  </div>
                </div>

                {/* UTR Box */}
                <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Claimed UTR / Reference
                  </span>
                  <p className="font-mono text-sm font-bold text-cyan-400 select-all tracking-wider">
                    {item.utr}
                  </p>
                </div>

                {/* Screenshot Thumbnail */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Uploaded Receipt
                  </span>
                  <div
                    onClick={() => setActiveScreenshot(item.screenshot_url)}
                    className="relative cursor-pointer group rounded-xl overflow-hidden border border-slate-800 bg-[#0B0F19] h-40 flex items-center justify-center"
                  >
                    <img
                      src={item.screenshot_url}
                      alt="Payment Receipt"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <span className="text-xs font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                        Click to Inspect Proof
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted: {new Date(item.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleApprove(item.payment_id)}
                    disabled={actionLoading === item.payment_id}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition-all hover:scale-[1.02]"
                  >
                    {actionLoading === item.payment_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>APPROVE</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setRejectingItem(item)}
                    disabled={actionLoading === item.payment_id}
                    className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>REJECT</span>
                  </button>
                </div>

                <a
                  href={`https://wa.me/91${item.mobile.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${item.player_name}, regarding your tournament registration ${item.registration_id} and UTR ${item.utr}:`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Inquire via WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-3xl w-full bg-[#131B2E] border border-slate-800 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setActiveScreenshot(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[80vh] overflow-auto rounded-2xl flex items-center justify-center">
              <img
                src={activeScreenshot}
                alt="Full Payment Screenshot"
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131B2E] border border-rose-800/80 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Reject Payment & Release Slot</h3>
            </div>

            <p className="text-xs text-slate-300">
              Rejecting payment will immediately release the reserved slot for other players and mark the registration as REJECTED.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-400">
                Reason for Rejection <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. UTR not matching official receiving bank statement, blur screenshot, incorrect amount..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectingItem.payment_id || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
