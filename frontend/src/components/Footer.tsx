import React from 'react';
import { Trophy, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  leagueName?: string;
  whatsappNumber?: string;
}

export const Footer: React.FC<FooterProps> = ({
  leagueName = 'Karnataka Premier League',
  whatsappNumber = '+919876543210',
}) => {
  return (
    <footer className="bg-[#080B12] border-t border-slate-800/80 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Branding */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-white font-display">
                {leagueName}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Official tournament registration and direct UPI payment verification platform. Transparent, automated slot reservation with strict capacity caps.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400/90 font-medium bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-md w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Verified Payments & Concurrency Protected</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">Tournament Overview</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">Player Registration</Link>
              </li>
              <li>
                <Link to="/status" className="hover:text-emerald-400 transition-colors">Track Application Status</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-amber-400 transition-colors">Administrator Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Help & Inquiries</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>support@cricketleague.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {leagueName}. All rights reserved.</p>
          <p className="mt-4 sm:mt-0">Built for fair, competitive cricket leagues.</p>
        </div>
      </div>
    </footer>
  );
};
