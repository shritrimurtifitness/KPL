import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, CheckCircle, ShieldCheck, ArrowRight, Zap, QrCode, Clock, Users, Award, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { AvailabilityData, LeagueSettings } from '../../types';
import { SlotBadge } from '../../components/SlotBadge';

export const LandingPage: React.FC = () => {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availRes, settingsRes] = await Promise.all([
          api.get('/league/availability'),
          api.get('/league/settings/public'),
        ]);
        setAvailability(availRes.data);
        setSettings(settingsRes.data);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const leagueName = settings?.league_name || 'Koparde Premier League';
  const tournamentTitle = settings?.tournament_title || 'Season 2027 Registration';
  const fee = settings?.registration_fee || 100;
  const maxRegistrations = availability?.maximum_capacity || 120;
  const availableSlots = availability?.available_slots ?? 120;
  const occupiedCount = availability?.occupied_count ?? 0;
  const isRegistrationOpen = availability?.registration_open ?? true;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-[#0F172A]/40 to-[#0B0F19]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Live Status Badge */}
            <div className="inline-flex items-center justify-center">
              {loading ? (
                <div className="h-8 w-48 bg-slate-800 rounded-full animate-pulse" />
              ) : (
                <SlotBadge
                  availableSlots={availableSlots}
                  totalCapacity={maxRegistrations}
                  occupiedCount={occupiedCount}
                  isOpen={isRegistrationOpen}
                />
              )}
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white leading-tight">
              {leagueName}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 text-3xl sm:text-5xl mt-2">
                {tournamentTitle}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Official player registration is now open. Compete with top cricketing talent. Transparent, concurrency-protected slot allocation with direct UPI verification.
            </p>

            {/* Quick Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="bg-[#131B2E]/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
                <span className="text-xs uppercase text-slate-400 font-medium">Registration Fee</span>
                <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">₹{fee}</p>
                <span className="text-[11px] text-slate-500">Per Player</span>
              </div>
              <div className="bg-[#131B2E]/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
                <span className="text-xs uppercase text-slate-400 font-medium">Player Cap</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{maxRegistrations}</p>
                <span className="text-[11px] text-slate-500">Strict Capacity</span>
              </div>
              <div className="bg-[#131B2E]/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
                <span className="text-xs uppercase text-slate-400 font-medium">Payment Mode</span>
                <p className="text-2xl font-bold text-cyan-400 mt-1">UPI</p>
                <span className="text-[11px] text-slate-500">Zero Gateway Surcharge</span>
              </div>
              <div className="bg-[#131B2E]/80 border border-slate-800 p-4 rounded-2xl text-center shadow-lg">
                <span className="text-xs uppercase text-slate-400 font-medium">Slot Hold</span>
                <p className="text-2xl font-bold text-slate-200 mt-1 font-mono">15 Min</p>
                <span className="text-[11px] text-slate-500">Temporary Lock</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {isRegistrationOpen && availableSlots > 0 ? (
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Trophy className="w-5 h-5 text-amber-300" />
                  <span>Register Now & Lock Slot</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <div className="bg-rose-950/50 border border-rose-800/80 text-rose-300 px-8 py-4 rounded-2xl font-semibold text-lg">
                  Registrations Full or Closed
                </div>
              )}

              <Link
                to="/status"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold px-6 py-4 rounded-2xl border border-slate-700 transition-colors"
              >
                <span>Track Existing Registration</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
            How The Registration Works
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Simple 4-step direct payment workflow without third-party gateway fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#131B2E] border border-slate-800/90 p-6 rounded-2xl relative shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fill Player Form</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter your cricket role, batting & bowling style, city, and verified mobile number.
            </p>
          </div>

          <div className="bg-[#131B2E] border border-slate-800/90 p-6 rounded-2xl relative shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Slot Locked (15m)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              An available slot is concurrency-reserved for you for 15 minutes while you make payment.
            </p>
          </div>

          <div className="bg-[#131B2E] border border-slate-800/90 p-6 rounded-2xl relative shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pay via UPI</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Scan the official QR code or tap the UPI intent button to pay ₹100 from any UPI app.
            </p>
          </div>

          <div className="bg-[#131B2E] border border-slate-800/90 p-6 rounded-2xl relative shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mb-4">
              4
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Admin Verification</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload your payment screenshot and 12-digit UTR. Admin manually verifies and confirms.
            </p>
          </div>
        </div>
      </section>

      {/* Rules and Guidelines */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#131B2E]/60 border border-slate-800 p-8 rounded-3xl">
          <div className="flex items-center space-x-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white font-display">Tournament Guidelines & Rules</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-start space-x-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Strict 120-player maximum limit. Once reached, no further applications are accepted.</span>
            </div>
            <div className="flex items-start space-x-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Only one active registration per mobile number to ensure fair opportunities for everyone.</span>
            </div>
            <div className="flex items-start space-x-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Payment proof submission must happen within 15 minutes of filling the registration form.</span>
            </div>
            <div className="flex items-start space-x-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Direct WhatsApp help is available for any payment inquiry or verification support.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
