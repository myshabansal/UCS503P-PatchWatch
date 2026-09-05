import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, User, ExternalLink, Activity, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">PATCHWATCH</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  MVP
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  location.pathname === '/' || location.pathname === '/dashboard'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/diagnostics"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  location.pathname === '/diagnostics'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Diagnostics</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.full_name || 'Developer'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono leading-tight truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
