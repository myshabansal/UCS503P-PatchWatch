import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email,
        password,
        full_name: fullName.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Join PatchWatch to audit your dependencies for security and health risks
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name (Optional)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
