import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Let ProtectedRoute or App handle initial loading
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-700/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-600/10 blur-[120px] pointer-events-none"></div>

      {/* Left side: Branding Panel */}
      <div className="flex-1 hidden md:flex flex-col justify-between p-12 relative z-10 border-r border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-display font-bold text-white text-xl shadow-lg shadow-brand-500/20">
            T
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">TripMind <span className="text-brand-400">AI</span></span>
        </div>

        <div className="max-w-md my-auto">
          <h1 className="font-display font-extrabold text-4xl leading-tight text-white mb-6">
            Plan your next adventure with the power of <span className="gradient-brand-text">AI</span>.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Upload flight confirmations, hotel bookings, or simply input your destinations. Let our intelligence assemble your dream itinerary in seconds.
          </p>

          {/* Testimonial preview */}
          <div className="glass p-6 rounded-2xl border-white/5 shadow-xl">
            <p className="text-slate-300 italic text-sm mb-4">
              "TripMind AI organized my entire 10-day Japan trip perfectly. Saved me hours of planning!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs text-white">
                JD
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Jonathan Doe</p>
                <p className="text-[10px] text-slate-500">Avid Traveler</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          © {new Date().getFullYear()} TripMind AI. All rights reserved.
        </div>
      </div>

      {/* Right side: Auth Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 justify-center mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center font-display font-bold text-white text-lg">
              T
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">TripMind <span className="text-brand-400">AI</span></span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
