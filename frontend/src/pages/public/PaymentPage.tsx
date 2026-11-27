import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  QrCode,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Clock,
  Smartphone
} from 'lucide-react';
import { api } from '../../services/api';
import { PublicRegistrationStatus, LeagueSettings } from '../../types';
import { CountdownTimer } from '../../components/CountdownTimer';
import { compressImage } from '../../utils/imageCompressor';

export const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registrationId = searchParams.get('id') || '';

  const [registration, setRegistration] = useState<PublicRegistrationStatus | null>(null);
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [utr, setUtr] = useState('');
  const [last4Digits, setLast4Digits] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalKb: number;
    compressedKb: number;
    reductionPercent: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (!registrationId) {
      setError('No Registration ID provided. Please complete the registration form first.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [regRes, setRes] = await Promise.all([
          api.get(`/registrations/${encodeURIComponent(registrationId)}/status`),
          api.get('/league/settings/public'),
        ]);
        setRegistration(regRes.data);
        setSettings(setRes.data);

        if (regRes.data.status === 'PAYMENT_SUBMITTED') {
          setSubmitSuccess(true);
          setWhatsappUrl(regRes.data.whatsapp_url);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load registration details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [registrationId]);

  const handleCopyUpi = () => {
    if (settings?.upi_id) {
      navigator.clipboard.writeText(settings.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        alert('Only JPG, JPEG, PNG, and WebP files are allowed.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert('Selected file is too large (max 15 MB uncompressed).');
        return;
      }

      setCompressing(true);
      setError(null);

      try {
        // Option A: Client-side compression targeting ~50 KB - 80 KB in WebP
        const result = await compressImage(file, {
          maxDimension: 1200,
          quality: 0.78,
        });

        setScreenshot(result.file);
        setPreviewUrl(result.previewUrl);
        setCompressionStats({
          originalKb: result.originalSizeKb,
          compressedKb: result.compressedSizeKb,
          reductionPercent: result.reductionPercent,
        });
      } catch (err: any) {
        console.error('Client compression error:', err);
        // Fallback to original file if compression canvas encounters issue
        setScreenshot(file);
        setPreviewUrl(URL.createObjectURL(file));
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot) {
      alert('Please upload a screenshot of your successful UPI payment.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('registration_id', registrationId);
    if (utr.trim()) {
      formData.append('utr', utr.trim().toUpperCase());
    }
    formData.append('screenshot', screenshot);

    try {
      const res = await api.post('/payments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitSuccess(true);
      setLast4Digits(utr.trim());
      setWhatsappUrl(res.data.whatsapp_url);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error && !registration) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-[#131B2E] border border-rose-800 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Notice</h2>
          <p className="text-slate-300 text-sm">{error}</p>
          <button
            onClick={() => navigate('/register')}
            className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  // Dynamic UPI Intent URI
  const amount = registration?.amount || settings?.registration_fee || 100;
  const upiId = settings?.upi_id || 'indrajeet.shirgaonkar-1@okaxis';
  const upiName = settings?.upi_display_name || 'INDUJI';
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(registrationId)}`;

  // Official QR Code image uploaded by admin or fallback dynamic generator
  const qrCodeUrl = settings?.upi_qr_path || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiIntentUri)}`;

  // Dynamic WhatsApp Click-to-Chat URL to +919922335991
  const rawTargetPhone = (settings?.whatsapp_number || '+919922335991').replace(/[^0-9]/g, '');
  const cleanTargetPhone = rawTargetPhone.length === 10 ? `91${rawTargetPhone}` : (rawTargetPhone || '919922335991');
  const utrDisplay = last4Digits.trim() || utr.trim() || 'Attached in Screenshot';
  const dynamicWhatsappMessage = `Hello Admin,\n\nI have completed my cricket league registration payment.\n\nRegistration ID: ${registrationId}\nName: ${registration?.full_name || 'Player'}\nAmount: ₹${amount}\nUPI Ref (Last 4 Digits): ${utrDisplay}\n\nPlease verify my payment screenshot and confirm my registration.\n\nThank you.`;
  const dynamicWhatsappUrl = `https://wa.me/${cleanTargetPhone}?text=${encodeURIComponent(dynamicWhatsappMessage)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header Card */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Step 2: Direct UPI Payment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
            Complete Registration Payment
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Player: <span className="text-white font-semibold">{registration?.full_name}</span> | Reg ID:{' '}
            <span className="font-mono text-emerald-400 font-bold">{registrationId}</span>
          </p>
        </div>

        {/* 10-Minute Countdown */}
        {registration?.reservation_expires_at && registration.status === 'RESERVED' && !submitSuccess && (
          <CountdownTimer
            expiresAt={registration.reservation_expires_at}
            onExpire={() => {
              setError('Your 10-minute reservation window has expired. The slot has been released.');
            }}
          />
        )}
      </div>

      {error && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-4 rounded-2xl flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Payment & Submission Content */}
      {submitSuccess ? (
        /* Success View */
        <div className="bg-[#131B2E] border border-emerald-800/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Payment Proof Submitted!
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your payment receipt and UTR reference have been recorded. Our admin team will verify the payment and confirm your registration slot.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl max-w-sm mx-auto text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Registration ID:</span>
              <span className="font-mono text-emerald-400 font-bold">{registrationId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Amount Paid:</span>
              <span className="text-white font-semibold">₹{amount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Status:</span>
              <span className="text-amber-400 font-semibold uppercase">Pending Verification</span>
            </div>
          </div>

          {/* Optional Last 4 Digits Input for WhatsApp */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl max-w-sm mx-auto text-left space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">
                Last 4 Digits of UPI Reference Number
              </label>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                Optional
              </span>
            </div>
            <input
              type="text"
              maxLength={16}
              placeholder="e.g. 3741 (Optional)"
              value={last4Digits}
              onChange={(e) => setLast4Digits(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono tracking-wider focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              Optional: Enter the last 4 digits to include in the notification to the admin (+91 9922335991).
            </p>
          </div>

          <div className="pt-2">
            <a
              href={dynamicWhatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-transform hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>Notify Admin on WhatsApp</span>
            </a>
            <p className="text-xs text-slate-500 mt-2">
              Click above to send your pre-filled registration details directly to the admin (+91 9922335991).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => navigate(`/status`)}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl"
            >
              Check Status Tracker
            </button>
          </div>
        </div>
      ) : (
        /* Payment Mode & Proof Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: UPI & QR Code (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Scan to Pay ₹{amount}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Official UPI QR Code</h3>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl w-60 h-60 mx-auto shadow-inner flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              {/* UPI ID Copy Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-medium">Official UPI ID</span>
                  <span className="text-slate-300 font-semibold">{upiName}</span>
                </div>
                <div className="flex items-center bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2">
                  <span className="font-mono text-xs sm:text-sm text-emerald-400 truncate flex-1 font-bold">
                    {upiId}
                  </span>
                  <button
                    onClick={handleCopyUpi}
                    className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedUpi && <p className="text-xs text-emerald-400 font-medium">UPI ID copied to clipboard!</p>}
              </div>

              {/* Mobile Quick Intent Button */}
              <div className="pt-2">
                <a
                  href={upiIntentUri}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Tap to Pay via UPI App</span>
                </a>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Opens GPay, PhonePe, Paytm, or BHIM on your smartphone.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Proof Submission Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Verification Required
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Submit Payment Proof</h3>
                <p className="text-xs text-slate-400 mt-1">
                  After paying ₹{amount}, upload your receipt screenshot and optionally provide the last 4 digits of the UPI reference.
                </p>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-6">
                {/* UTR Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Last 4 Digits of UPI Reference Number
                    </label>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                      Optional
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="e.g. 3741 (Optional)"
                    value={utr}
                    onChange={(e) => {
                      setUtr(e.target.value);
                      setLast4Digits(e.target.value);
                    }}
                    className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Optional: Enter the last 4 digits (or full reference) from your UPI receipt to help admin verify faster.
                  </p>
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Payment Screenshot Receipt <span className="text-rose-400">*</span>
                  </label>

                  <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-[#0B0F19]/60">
                    {compressing ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                        <span className="text-sm font-semibold text-slate-200">
                          Optimizing image for fast upload (~50-80 KB)...
                        </span>
                        <span className="text-xs text-slate-500">
                          Preserving UTR clarity & text sharpness
                        </span>
                      </div>
                    ) : previewUrl ? (
                      <div className="space-y-3">
                        <img
                          src={previewUrl}
                          alt="Screenshot Preview"
                          className="max-h-48 mx-auto rounded-lg shadow-md border border-slate-700"
                        />

                        {compressionStats && (
                          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                            <span>✨ Optimized:</span>
                            <span className="font-mono text-slate-300 line-through">
                              {compressionStats.originalKb} KB
                            </span>
                            <span>➔</span>
                            <span className="font-mono font-bold text-white">
                              {compressionStats.compressedKb} KB
                            </span>
                            <span className="text-[10px] text-emerald-300">
                              ({compressionStats.reductionPercent}% smaller)
                            </span>
                          </div>
                        )}

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshot(null);
                              setPreviewUrl(null);
                              setCompressionStats(null);
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Remove and Choose Another
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                        <span className="text-sm font-semibold text-slate-300 block">
                          Click to upload payment screenshot
                        </span>
                        <span className="text-xs text-slate-500 block">
                          JPG, JPEG, PNG, or WebP (Automatically optimized to ~50–80 KB)
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit Proof Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading Proof & Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Submit Payment Proof for Verification</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
