import React, { useEffect, useState } from 'react';
import { checkBackendHealth } from '../services/api';
import type { HealthCheckResponse } from '../types/health';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Layers,
  Terminal,
  Sparkles,
} from 'lucide-react';

export const Diagnostics: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const result = await checkBackendHealth();
    if (result.error) {
      setError(result.error);
      setHealthData(null);
    } else if (result.data) {
      setHealthData(result.data);
      setError(null);
    }
    setLatency(result.latencyMs);
    setLastChecked(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Diagnostics Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#10192e] to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              System Diagnostics & Telemetry
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Backend & Database Connectivity Status
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Real-time monitoring of the FastAPI service, PostgreSQL/SQLite engine, and network latency.
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-test Connectivity</span>
          </button>
        </div>
      </section>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">FastAPI Backend</div>
              <div className="text-lg font-bold text-white mt-1">
                {healthData ? healthData.app_name : 'PatchWatch API'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {healthData ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className={`text-xs font-semibold ${healthData ? 'text-emerald-400' : 'text-rose-400'}`}>
                {healthData ? 'Responding 200 OK' : 'Unreachable'}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {healthData ? `v${healthData.version}` : 'N/A'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Database Engine</div>
              <div className="text-lg font-bold text-white mt-1 capitalize">
                {healthData?.database.dialect || 'SQLAlchemy Engine'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {healthData?.database.status === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400" />
              )}
              <span
                className={`text-xs font-semibold ${
                  healthData?.database.status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {healthData?.database.status === 'connected' ? 'Connected' : 'Standby / Ready'}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono truncate max-w-[120px]">
              {healthData?.database.database || 'patchwatch'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Round-Trip Latency</div>
              <div className="text-lg font-bold text-white mt-1">
                {latency !== null ? `${latency} ms` : '--'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Last Synced</span>
            <span className="text-xs text-slate-500 font-mono">
              {lastChecked ? lastChecked.toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Raw JSON Payload */}
      <section className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Health Payload (`GET /api/v1/health`)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Status: {healthData ? '200 OK' : error ? 'Error' : '...'}
          </span>
        </div>
        <div className="p-5 font-mono text-xs overflow-x-auto bg-[#070b12] text-slate-300">
          {loading && !healthData ? (
            <div className="py-4 text-slate-500 text-center animate-pulse">Querying backend API...</div>
          ) : error ? (
            <div className="text-rose-400 space-y-1">
              <p className="font-semibold">Connection failed:</p>
              <p className="text-slate-400">{error}</p>
            </div>
          ) : (
            <pre className="text-emerald-400">{JSON.stringify(healthData, null, 2)}</pre>
          )}
        </div>
      </section>
    </div>
  );
};
