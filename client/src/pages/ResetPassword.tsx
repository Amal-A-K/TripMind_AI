import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset token.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const res = await authService.resetPassword(token, password);
      setSuccess(res.message || 'Your password has been successfully updated.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">
          Reset Password
        </h2>
        <p className="text-slate-400 text-sm">
          Please enter and confirm your new password below.
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
            <p className="text-sm">Password Reset Complete</p>
          </div>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            {success}
          </p>
          <div className="pt-4">
            <Link to="/login" className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2">
              Proceed to Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 h-5 text-slate-500 pointer-events-none" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base pr-10 pl-11"
                placeholder="•••••••• (Min 6 chars)"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 active:scale-95 transition-all duration-200 focus:outline-none focus:text-brand-400 p-1 rounded-md"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 h-5 text-slate-500 pointer-events-none" size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-base pr-10 pl-11"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 active:scale-95 transition-all duration-200 focus:outline-none focus:text-brand-400 p-1 rounded-md"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
                Resetting Password...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {!success && (
        <p className="text-center text-sm text-slate-400 mt-6">
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Sign In
          </Link>
        </p>
      )}
    </div>
  );
}
