import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MessageCircle,
  Loader2,
  CreditCard,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';
import { PublicRegistrationStatus } from '../../types';
import { resolveMediaUrl } from '../../utils/media';
import { ImageViewerModal } from '../../components/ImageViewerModal';

export const StatusLookupPage: React.FC = () => {
  const [registrationId, setRegistrationId] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicRegistrationStatus | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !mobile.trim()) {
      setError('Please provide both Registration ID and Registered Mobile number.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/registrations/lookup', {
        registration_id: registrationId.trim(),
        mobile: mobile.trim(),
      });
      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'No matching registration found. Please check your Registration ID and Mobile number.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'PAYMENT_SUBMITTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Clock className="w-3.5 h-3.5" />
            <span>VERIFICATION PENDING</span>
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <CreditCard className="w-3.5 h-3.5" />
            <span>PAYMENT PENDING</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECTED</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700/60 text-slate-400 border border-slate-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>EXPIRED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-white font-display">
          Registration Status Tracker
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Enter your Registration ID and Mobile Number to check your registration and payment verification progress.
        </p>
      </div>

      {/* Dual Key Lookup Form Card */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleLookup} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Registration ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. KPL-2027-001"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value.toUpperCase())}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Registered Mobile Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Checking Status...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Lookup Registration</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-5 rounded-2xl flex items-start space-x-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Lookup Failed</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
            <div className="flex items-center space-x-4">
              {result.photo_url ? (
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(true)}
                  className="focus:outline-none group relative cursor-pointer shrink-0"
                  title="Click to view full photo on page"
                >
                  <img
                    src={resolveMediaUrl(result.photo_url)}
                    alt={result.full_name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0 bg-slate-900 group-hover:border-emerald-400 transition-colors"
                  />
                </button>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <User className="w-8 h-8" />
                </div>
              )}
              <div>
                <span className="text-xs text-slate-400 uppercase font-medium">Registration Details</span>
                <h2 className="text-2xl font-bold text-white mt-0.5">{result.full_name}</h2>
                <span className="font-mono text-sm text-emerald-400 font-bold">
                  {result.registration_id}
                </span>
              </div>
            </div>
            <div>{getStatusBadge(result.status)}</div>
          </div>

          {/* Status Instruction Callout */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm leading-relaxed text-slate-200">
            <span className="font-semibold block text-slate-100 mb-1">Status Update:</span>
            {result.status_message}
          </div>

          {/* Quick Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Cricket Role</span>
              <span className="text-white font-semibold mt-1 block">{result.cricket_role}</span>
            </div>
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">City</span>
              <span className="text-white font-semibold mt-1 block">{result.city}</span>
            </div>
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Fee Amount</span>
              <span className="text-amber-400 font-bold mt-1 block font-mono">₹{result.amount}</span>
            </div>
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">UTR Reference</span>
              <span className="text-slate-200 font-mono mt-1 block truncate">
                {result.utr || 'Not submitted'}
              </span>
            </div>
          </div>

          {/* Action Buttons based on status */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            {result.status === 'RESERVED' && (
              <Link
                to={`/payment?id=${encodeURIComponent(result.registration_id)}`}
                className="inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3 rounded-xl shadow-md"
              >
                <CreditCard className="w-4 h-4" />
                <span>Complete Payment Now</span>
              </Link>
            )}

            {result.whatsapp_url && (
              <a
                href={result.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold px-6 py-3 rounded-xl shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>Contact Admin on WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}
      {/* In-Page Image Viewer Modal */}
      {result && (
        <ImageViewerModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          imageUrl={resolveMediaUrl(result.photo_url)}
          title={result.full_name}
          subtitle={`${result.registration_id} • Player Profile Photograph`}
          badge={result.registration_id}
          type="photo"
        />
      )}
    </div>
  );
};
