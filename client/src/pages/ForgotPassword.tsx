import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const res = await authService.forgotPassword(email);
      setSuccess(res.message || 'We have sent a temporary password reset link to your email address.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please check your email and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
          Forgot Password?
        </h2>
        <p className="text-slate-400 text-sm">
          No worries! Just enter your email and we'll send you a link to reset it.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success ? (
        <div className="glass p-6 rounded-2xl border-emerald-500/10 space-y-4 text-center md:text-left">
          <div className="flex items-center gap-3 text-emerald-400 font-semibold mb-2">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <p className="text-sm">Link Sent Successfully</p>
          </div>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            {success}
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link to="/login" className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 h-5 text-slate-500 pointer-events-none" size={18} />
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base pl-11"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Link...
              </>
            ) : (
              <>
                Send Reset Link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {!success && (
        <p className="text-center text-sm text-slate-400 mt-6">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Sign In
          </Link>
        </p>
      )}
    </div>
  );
}
