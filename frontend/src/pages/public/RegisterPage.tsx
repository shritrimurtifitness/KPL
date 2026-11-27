import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Trophy,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Camera,
  Upload,
  User,
  Check,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { AvailabilityData, LeagueSettings } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

const INDIAN_MOBILE_REGEX = /^(?:(?:\+|00)91[\s-]?)?[6789]\d{9}$/;

const registrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  mobile: z.string().regex(INDIAN_MOBILE_REGEX, 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9'),
  age: z.coerce.number().min(10, 'Player age must be at least 10').max(80, 'Player age cannot exceed 80'),
  city: z.string().min(2, 'City / District is required'),
  cricket_role: z.enum(['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'], {
    errorMap: () => ({ message: 'Please select your primary cricket role' }),
  }),
  batting_style: z.string().optional(),
  bowling_style: z.string().optional(),
  photo_path: z.string().min(1, 'Player profile photograph is mandatory. Please upload your photo.'),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions to proceed' }),
  }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Player Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCompressing, setPhotoCompressing] = useState(false);
  const [photoStats, setPhotoStats] = useState<{
    originalKb: number;
    compressedKb: number;
    reductionPercent: number;
  } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      cricket_role: 'Batsman',
      batting_style: 'Right-hand bat',
      bowling_style: 'Right-arm medium',
      photo_path: '',
      terms_accepted: true,
    },
  });

  const selectedRole = watch('cricket_role');

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const [availRes, setRes] = await Promise.all([
          api.get('/league/availability'),
          api.get('/league/settings/public'),
        ]);
        setAvailability(availRes.data);
        setSettings(setRes.data);
      } catch (err) {
        console.error('Failed to load league details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeagueData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      setPhotoError('Only JPG, JPEG, PNG, and WebP images are allowed.');
      return;
    }

    setPhotoCompressing(true);
    setPhotoError(null);

    try {
      // 1. Client-side compression targeting ~30-50 KB for headshots
      const compressed = await compressImage(file, {
        maxDimension: 800,
        quality: 0.78,
      });

      // 2. Upload compressed photograph
      const formData = new FormData();
      formData.append('photo', compressed.file);

      const res = await api.post('/registrations/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setValue('photo_path', res.data.photo_path, { shouldValidate: true });
      setPhotoPreview(compressed.previewUrl);
      setPhotoStats({
        originalKb: compressed.originalSizeKb,
        compressedKb: compressed.compressedSizeKb,
        reductionPercent: compressed.reductionPercent,
      });
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setPhotoError(err.response?.data?.detail || 'Failed to upload photograph. Please try another image.');
    } finally {
      setPhotoCompressing(false);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/registrations', {
        full_name: data.full_name,
        mobile: data.mobile,
        age: data.age,
        city: data.city,
        cricket_role: data.cricket_role,
        batting_style:
          data.cricket_role === 'Bowler'
            ? null
            : (data.batting_style || 'Right-hand bat'),
        bowling_style:
          data.cricket_role === 'Batsman' || data.cricket_role === 'Wicketkeeper'
            ? null
            : (data.bowling_style || 'Right-arm medium'),
        photo_path: data.photo_path,
        terms_accepted: data.terms_accepted,
      });

      const registrationId = response.data.registration_id;
      navigate(`/payment?id=${encodeURIComponent(registrationId)}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your inputs and try again.';
      setServerError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClosed = availability && (!availability.registration_open || availability.available_slots <= 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-[#131B2E] border border-rose-800/80 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Registrations Closed</h2>
          <p className="text-slate-300 text-sm">
            All 120 tournament registration slots are completely filled or registration has concluded.
          </p>
          <button
            onClick={() => navigate('/status')}
            className="mt-4 px-6 py-2.5 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-sm font-semibold"
          >
            Check Status of Existing Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Official Entry Form
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
                Player Registration
              </h1>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Registration Fee</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                ₹{settings?.registration_fee || 100}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Submitting this form reserves your slot for 15 minutes to complete direct UPI payment.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-4 rounded-2xl flex items-start space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Registration Error</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Mandatory Player Photo Section */}
          <div className="bg-[#0B0F19]/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Player Profile Photograph</span>
                  <span className="text-rose-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a clear passport/face photograph for your official tournament ID badge.
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Mandatory
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              {/* Photo Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg">
                  {photoCompressing ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-1" />
                      <span className="text-[10px] text-slate-300">Optimizing...</span>
                    </div>
                  ) : photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Player Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-500">
                      <User className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                      <span className="text-[10px] block font-medium">No Photo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls & Compression Stats */}
              <div className="flex-1 space-y-3 w-full">
                <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold transition-all shadow-md">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{photoPreview ? 'Change Photograph' : 'Upload Player Photo'}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photoStats && (
                  <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Photo compressed:</span>
                    <span className="text-slate-400 line-through font-mono">
                      {photoStats.originalKb} KB
                    </span>
                    <span>➔</span>
                    <span className="font-mono font-bold text-white">
                      {photoStats.compressedKb} KB
                    </span>
                    <span className="text-[10px] text-emerald-300">
                      ({photoStats.reductionPercent}% smaller)
                    </span>
                  </div>
                )}

                {photoError && (
                  <p className="text-xs text-rose-400 font-medium">{photoError}</p>
                )}
                {errors.photo_path && (
                  <p className="text-xs text-rose-400 font-semibold">{errors.photo_path.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Virat Sharma"
                {...register('full_name')}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors"
              />
              {errors.full_name && (
                <p className="text-xs text-rose-400">{errors.full_name.message}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mobile Number (10 Digits) <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('mobile')}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors font-mono"
              />
              {errors.mobile && (
                <p className="text-xs text-rose-400">{errors.mobile.message}</p>
              )}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Age <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 24"
                {...register('age')}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors font-mono"
              />
              {errors.age && (
                <p className="text-xs text-rose-400">{errors.age.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                City / District <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                {...register('city')}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors"
              />
              {errors.city && (
                <p className="text-xs text-rose-400">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Cricket Role Selection & Dynamic Options */}
          <div className="bg-[#0B0F19]/80 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-200 block">
                Select Your Cricket Role <span className="text-rose-400">*</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose your primary playing role to configure your specialization.
              </p>
            </div>

            {/* 4 Interactive Role Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { role: 'Batsman', label: 'Batsman', emoji: '🏏', desc: 'Top/Middle order' },
                { role: 'Bowler', label: 'Bowler', emoji: '⚡', desc: 'Pace or Spin' },
                { role: 'All-rounder', label: 'All-rounder', emoji: '⭐', desc: 'Bat & Ball' },
                { role: 'Wicketkeeper', label: 'Wicketkeeper', emoji: '🧤', desc: 'Keeper-Batsman' },
              ].map((item) => {
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      setValue('cricket_role', item.role as any, { shouldValidate: true });
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 shadow-md shadow-emerald-950/40 text-white'
                        : 'bg-[#131B2E] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{item.emoji}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold block text-white">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>
            {errors.cricket_role && (
              <p className="text-xs text-rose-400">{errors.cricket_role.message}</p>
            )}

            {/* Conditional Specialization Options */}
            <div className="pt-3 border-t border-slate-800/80">
              {/* If Batsman or Wicketkeeper -> Batting Style */}
              {(selectedRole === 'Batsman' || selectedRole === 'Wicketkeeper') && (
                <div className="space-y-2 max-w-sm">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Batting Style <span className="text-rose-400">*</span>
                  </label>
                  <select
                    {...register('batting_style')}
                    className="w-full bg-[#131B2E] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-colors"
                  >
                    <option value="Right-hand bat">Right-hand bat</option>
                    <option value="Left-hand bat">Left-hand bat</option>
                  </select>
                </div>
              )}

              {/* If Bowler -> Bowling Style */}
              {selectedRole === 'Bowler' && (
                <div className="space-y-2 max-w-sm">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Bowling Style <span className="text-rose-400">*</span>
                  </label>
                  <select
                    {...register('bowling_style')}
                    className="w-full bg-[#131B2E] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-colors"
                  >
                    <option value="Right-arm fast">Right-arm fast</option>
                    <option value="Right-arm medium">Right-arm medium</option>
                    <option value="Right-arm off-spin">Right-arm off-spin</option>
                    <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                    <option value="Left-arm fast">Left-arm fast</option>
                    <option value="Left-arm orthodox spin">Left-arm orthodox spin</option>
                    <option value="Left-arm chinaman">Left-arm chinaman</option>
                  </select>
                </div>
              )}

              {/* If All-rounder -> Both Batting & Bowling Style */}
              {selectedRole === 'All-rounder' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Batting Style <span className="text-rose-400">*</span>
                    </label>
                    <select
                      {...register('batting_style')}
                      className="w-full bg-[#131B2E] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-colors"
                    >
                      <option value="Right-hand bat">Right-hand bat</option>
                      <option value="Left-hand bat">Left-hand bat</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Bowling Style <span className="text-rose-400">*</span>
                    </label>
                    <select
                      {...register('bowling_style')}
                      className="w-full bg-[#131B2E] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none transition-colors"
                    >
                      <option value="Right-arm fast">Right-arm fast</option>
                      <option value="Right-arm medium">Right-arm medium</option>
                      <option value="Right-arm off-spin">Right-arm off-spin</option>
                      <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                      <option value="Left-arm fast">Left-arm fast</option>
                      <option value="Left-arm orthodox spin">Left-arm orthodox spin</option>
                      <option value="Left-arm chinaman">Left-arm chinaman</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms and conditions */}
          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms_accepted')}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                I agree to the tournament regulations, commit to fair play, and understand that the ₹100 registration fee is required to confirm my slot.
              </span>
            </label>
            {errors.terms_accepted && (
              <p className="text-xs text-rose-400 mt-2">{errors.terms_accepted.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || photoCompressing}
            className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Reserving Slot...</span>
              </>
            ) : (
              <>
                <span>Proceed to UPI Payment (₹{settings?.registration_fee || 100})</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
