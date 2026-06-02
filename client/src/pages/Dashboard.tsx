import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useItineraries } from '@/hooks/useItineraries';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import type { Itinerary } from '@/types';
import { 
  Plus, 
  Calendar, 
  Compass, 
  Trash2, 
  Eye, 
  Clock, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { itineraries, isLoading, error, remove } = useItineraries();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [itineraryToDelete, setItineraryToDelete] = useState<Itinerary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStyleColor = (style?: string) => {
    switch (style?.toLowerCase()) {
      case 'adventure': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'luxury': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'budget': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'relaxed': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, itinerary: Itinerary) => {
    e.preventDefault();
    e.stopPropagation();
    setItineraryToDelete(itinerary);
  };

  const handleConfirmDelete = async () => {
    if (!itineraryToDelete) return;
    setIsDeleting(true);
    try {
      await remove(itineraryToDelete._id);
      addToast('Itinerary deleted successfully!', 'success');
      setItineraryToDelete(null);
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : 'Failed to delete itinerary', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-none mb-2">
            Welcome back, <span className="gradient-brand-text">{user?.name || 'Traveler'}</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Manage your plans or spark a new AI travel itinerary.
          </p>
        </div>
        <Link to="/generate" className="btn-primary shadow-lg shadow-brand-500/15">
          <Plus size={16} />
          Create New Trip
        </Link>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass p-5 rounded-2xl border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-white">
            <Compass size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Trips</p>
            <p className="text-2xl font-bold text-white">{isLoading ? '...' : itineraries.length}</p>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Destinations</p>
            <p className="text-2xl font-bold text-white">
              {isLoading ? '...' : Array.from(new Set(itineraries.map(i => i.destination.toLowerCase()))).length}
            </p>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-600/20 border border-accent-500/30 flex items-center justify-center text-accent-400">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Latest Trip</p>
            <p className="text-sm font-bold text-white truncate max-w-[150px]">
              {isLoading ? '...' : itineraries[0]?.destination || 'None planned'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        <h3 className="font-display font-bold text-xl text-white">Your Saved Itineraries</h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-2xl border-white/5 p-6 space-y-4 h-[240px]">
                <div className="skeleton h-6 w-2/3"></div>
                <div className="skeleton h-4 w-1/2"></div>
                <div className="space-y-2 pt-4">
                  <div className="skeleton h-3 w-full"></div>
                  <div className="skeleton h-3 w-5/6"></div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="skeleton h-8 w-20"></div>
                  <div className="skeleton h-8 w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
            <p className="text-rose-400 text-sm font-medium">{error}</p>
            <button onClick={() => navigate(0)} className="btn-ghost text-xs py-1.5 px-3">Retry</button>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="glass rounded-3xl border-dashed border-slate-800 p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-2">
              <Sparkles size={32} />
            </div>
            <h4 className="font-display font-bold text-lg text-white">No travel itineraries found</h4>
            <p className="text-slate-400 max-w-sm text-sm">
              Generate a custom, day-by-day travel plan instantly or parse your booking confirmation documents using artificial intelligence.
            </p>
            <Link to="/generate" className="btn-primary mt-2">
              <Plus size={16} />
              Generate Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <Link 
                key={itinerary._id} 
                to={`/itinerary/${itinerary._id}`}
                className="card relative flex flex-col justify-between overflow-hidden group h-[260px]"
              >
                {/* Visual hover border overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="space-y-3 relative z-10">
                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${getStyleColor(itinerary.travelStyle)}`}>
                      {itinerary.travelStyle || 'Explore'}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteClick(e, itinerary)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Itinerary"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-lg text-slate-100 group-hover:text-white line-clamp-1 transition-colors">
                      {itinerary.destination}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-500" />
                      {itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}
                      {itinerary.budget && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 text-xs font-medium">₹</span>
                          {itinerary.budget}
                        </>
                      )}
                    </p>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">
                    {itinerary.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10 text-[11px] font-semibold text-slate-400 group-hover:text-brand-400 transition-colors">
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {itinerary.isPublic ? 'Public / Shared' : 'Private'}
                  </span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Plan
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={itineraryToDelete !== null}
        onClose={() => setItineraryToDelete(null)}
        onConfirm={handleConfirmDelete}
        itinerary={itineraryToDelete}
        isDeleting={isDeleting}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border flex items-start gap-3 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in-left ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
                : 'bg-slate-900/90 border-slate-800/80 text-slate-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertCircle size={16} className="text-rose-400" />
              ) : (
                <Sparkles size={16} className="text-brand-400" />
              )}
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
