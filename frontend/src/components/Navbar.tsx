import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Shield, Search, UserPlus, Menu, X } from 'lucide-react';

interface NavbarProps {
  leagueName?: string;
  tournamentTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  leagueName = 'Koparde Premier League',
  tournamentTitle = 'Season 2027 Registration',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & League Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-400 p-[2px] shadow-lg shadow-emerald-950/40">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                <Trophy className="w-6 h-6 text-amber-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-white block leading-tight">
                {leagueName}
              </span>
              <span className="text-xs font-medium text-emerald-400 tracking-wider uppercase">
                {tournamentTitle}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/')
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Tournament Info
            </Link>

            <Link
              to="/status"
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${
                isActive('/status')
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Check Status</span>
            </Link>

            <Link
              to="/admin/login"
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${
                isActive('/admin/login') || location.pathname.startsWith('/admin')
                  ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Admin Portal</span>
            </Link>

            <Link
              to="/register"
              className="ml-3 inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Now</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-2 bg-[#0E1526] border-b border-slate-800">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Tournament Info
          </Link>
          <Link
            to="/status"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Check Status
          </Link>
          <Link
            to="/admin/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Admin Portal
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-3 rounded-lg shadow-md"
          >
            Register Now (₹100)
          </Link>
        </div>
      )}
    </nav>
  );
};
