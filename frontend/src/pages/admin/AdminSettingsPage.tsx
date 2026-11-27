import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Users,
  ShieldCheck,
  Smartphone,
  Calendar,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { LeagueSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (!settings) return;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings({ ...settings, [name]: checked });
    } else if (type === 'number') {
      setSettings({ ...settings, [name]: parseFloat(value) || 0 });
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put('/admin/settings', settings);
      setSettings(res.data);
      setMessage({ type: 'success', text: 'League tournament settings successfully updated and applied!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update settings. Please verify inputs.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Tournament Settings & Configurations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Adjust league branding, capacity caps, UPI payment credentials, and tournament rules
        </p>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-start space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Card 1: Tournament Identity */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Tournament & League Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                League Name
              </label>
              <input
                type="text"
                name="league_name"
                value={settings.league_name}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Tournament Title
              </label>
              <input
                type="text"
                name="tournament_title"
                value={settings.tournament_title}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Registration ID Prefix
              </label>
              <input
                type="text"
                name="registration_prefix"
                value={settings.registration_prefix}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Tournament Year
              </label>
              <input
                type="number"
                name="registration_year"
                value={settings.registration_year}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Capacity & Operational Rules */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Capacity & Reservation Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Maximum Player Limit
              </label>
              <input
                type="number"
                name="maximum_registrations"
                value={settings.maximum_registrations}
                onChange={handleInputChange}
                min={1}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Cannot be lowered below current active occupancy
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Registration Fee (₹)
              </label>
              <input
                type="number"
                name="registration_fee"
                value={settings.registration_fee}
                onChange={handleInputChange}
                min={1}
                step="any"
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Locked once players submit payments
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Reservation Expiry (Minutes)
              </label>
              <input
                type="number"
                name="reservation_minutes"
                value={settings.reservation_minutes}
                onChange={handleInputChange}
                min={1}
                max={120}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Temporary hold duration (Default: 10m)
              </span>
            </div>
          </div>

          {/* Toggle Open/Closed */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <span className="text-sm font-bold text-white block">Registrations Open Status</span>
              <span className="text-xs text-slate-400">
                Temporarily pause or open new incoming registrations
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="registration_open"
                checked={settings.registration_open}
                onChange={(e) => setSettings({ ...settings, registration_open: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Card 3: Direct UPI & Contact Settings */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <span>Direct UPI & WhatsApp Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Official Receiving UPI ID
              </label>
              <input
                type="text"
                name="upi_id"
                value={settings.upi_id}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">
                e.g. yourname@okhdfcbank or upi@bank
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                UPI Account Display Name
              </label>
              <input
                type="text"
                name="upi_display_name"
                value={settings.upi_display_name}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Admin WhatsApp Number (Click-to-Chat)
              </label>
              <input
                type="text"
                name="whatsapp_number"
                value={settings.whatsapp_number}
                onChange={handleInputChange}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Include country code e.g. +919876543210
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Max Upload Size (MB)
              </label>
              <input
                type="number"
                name="max_upload_size_mb"
                value={settings.max_upload_size_mb}
                onChange={handleInputChange}
                min={1}
                max={20}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Instructions & Terms */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span>Public Instructions & Legal Terms</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Registration Instructions
              </label>
              <textarea
                name="registration_instructions"
                rows={4}
                value={settings.registration_instructions}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-slate-100 text-xs leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-slate-300">
                Terms and Conditions
              </label>
              <textarea
                name="terms_and_conditions"
                rows={4}
                value={settings.terms_and_conditions}
                onChange={handleInputChange}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-slate-100 text-xs leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-amber-950/40 transition-all hover:scale-[1.01]"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
