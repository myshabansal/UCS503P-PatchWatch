import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  ShieldCheck,
  PlusCircle,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#101b33] to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated Session Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.full_name || 'Developer'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Logged in as <span className="text-slate-200 font-mono">{user?.email}</span> &bull; Member since{' '}
              {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/diagnostics"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>System Health</span>
            </Link>

            <button
              disabled
              title="Available in Phase 3"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/50 text-white/70 text-xs font-semibold shadow-lg cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Project (Phase 3)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Projects</div>
            <div className="text-2xl font-black text-white mt-1">0</div>
            <div className="text-[11px] text-slate-500 mt-1">Ready for Phase 3</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dependencies</div>
            <div className="text-2xl font-black text-white mt-1">0</div>
            <div className="text-[11px] text-slate-500 mt-1">npm & Python packages</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Known CVEs</div>
            <div className="text-2xl font-black text-white mt-1">0</div>
            <div className="text-[11px] text-emerald-400 mt-1">Clean slate</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Scheduled Scans</div>
            <div className="text-2xl font-black text-white mt-1">Inactive</div>
            <div className="text-[11px] text-slate-500 mt-1">Manual / Daily / Weekly</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Projects Container (Phase 3 Preview) */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Projects</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload package.json, package-lock.json, or requirements.txt to start analyzing dependency risks.
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="py-12 border border-dashed border-slate-800 rounded-xl text-center space-y-3 bg-slate-950/40">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 text-slate-400">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No projects created yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You are ready for <strong>Phase 3 (Project Management)</strong>. In Phase 3, you will be able to create
            projects, upload dependency manifests, and trigger vulnerability scans!
          </p>
          <div className="pt-2">
            <Link
              to="/diagnostics"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>View System & Database Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
