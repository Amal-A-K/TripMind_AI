import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { itineraryService } from '@/services/itineraryService';
import { formatRawCost } from '@/utils/currency';
import type { Itinerary } from '@/types';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  Sparkles,
  Compass,
  Hotel,
  Utensils,
  Plane,
  Info,
  Clock
} from 'lucide-react';

export default function ItineraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs & sharing states
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);

  useEffect(() => {
    const fetchItinerary = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await itineraryService.getById(id);
        setItinerary(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load itinerary details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchItinerary();
  }, [id]);

  const handleToggleShare = async () => {
    if (!itinerary) return;
    try {
      setIsUpdatingShare(true);
      const updated = await itineraryService.togglePublic(itinerary._id);
      setItinerary(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const handleCopyLink = () => {
    if (!itinerary) return;
    const shareUrl = `${window.location.origin}/share/${itinerary.shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'accommodation': return <Hotel className="w-4 h-4 text-sky-400" />;
      case 'food': return <Utensils className="w-4 h-4 text-amber-400" />;
      case 'transport': return <Plane className="w-4 h-4 text-emerald-400" />;
      case 'activity': return <Compass className="w-4 h-4 text-violet-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category.toLowerCase()) {
      case 'accommodation': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'food': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'transport': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'activity': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="skeleton h-8 w-24"></div>
        </div>
        <div className="glass rounded-3xl p-6 md:p-8 space-y-6">
          <div className="skeleton h-10 w-2/3"></div>
          <div className="skeleton h-6 w-1/3"></div>
          <div className="skeleton h-24 w-full"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="skeleton h-[400px] lg:col-span-2"></div>
          <div className="skeleton h-[250px]"></div>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4 animate-fade-in">
        <h4 className="font-display font-bold text-lg text-white">Something went wrong</h4>
        <p className="text-rose-400 text-sm">{error || 'Could not find the requested itinerary.'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-ghost">
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const selectedDay = itinerary.days[selectedDayIdx];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Navigation and Sharing Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleShare}
            disabled={isUpdatingShare}
            className={`btn-ghost text-xs md:text-sm py-2 px-4 flex items-center gap-2 ${
              itinerary.isPublic ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : ''
            }`}
          >
            {itinerary.isPublic ? <Eye size={16} /> : <EyeOff size={16} />}
            {itinerary.isPublic ? 'Public / Shared' : 'Keep Private'}
          </button>

          {itinerary.isPublic && (
            <button
              onClick={handleCopyLink}
              className="btn-primary text-xs md:text-sm py-2 px-4 flex items-center gap-2 shadow-md shadow-brand-500/10"
            >
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
              {isCopied ? 'Link Copied!' : 'Copy Share Link'}
            </button>
          )}
        </div>
      </div>

      {/* Main Cover Header */}
      <div className="glass rounded-3xl border-white/5 p-6 md:p-8 relative overflow-hidden space-y-4">
        <div className="absolute top-[-40%] right-[-10%] w-[40%] h-[150%] rounded-full bg-brand-500/10 blur-[100px] pointer-events-none"></div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border bg-brand-500/10 border-brand-500/20 text-brand-300">
            {itinerary.travelStyle || 'Custom'}
          </span>
          {itinerary.budget && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border bg-slate-800 border-slate-700/50 text-slate-300">
              {itinerary.budget} Budget
            </span>
          )}
        </div>

        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-none mb-1">
          {itinerary.destination}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}</span>
          </div>
          {itinerary.totalEstimatedCost && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">₹</span>
              <span>Est. Cost: {formatRawCost(itinerary.totalEstimatedCost)}</span>
            </div>
          )}
          {itinerary.startDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Starts: {new Date(itinerary.startDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/5 pt-4 mt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Trip Summary</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{itinerary.summary}</p>
        </div>
      </div>

      {/* Main Grid: Details Left, Meta/Tips Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Days Details (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-800">
            {itinerary.days.map((dayData, idx) => (
              <button
                key={dayData.day}
                onClick={() => setSelectedDayIdx(idx)}
                className={`py-2.5 px-4 rounded-xl font-display font-bold text-sm whitespace-nowrap border shrink-0 transition-all ${
                  selectedDayIdx === idx 
                    ? 'bg-brand-500 border-brand-400 text-white shadow-md'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Day {dayData.day}
              </button>
            ))}
          </div>

          {/* Activities List */}
          {selectedDay && (
            <div className="glass rounded-3xl border-white/5 p-6 md:p-8 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
                <h2 className="font-display font-extrabold text-xl text-white">
                  Day {selectedDay.day}: {selectedDay.theme || 'Exploration'}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-800/60 py-1 px-3 rounded-full border border-slate-700/50">
                  {selectedDay.activities.length} {selectedDay.activities.length === 1 ? 'Activity' : 'Activities'}
                </span>
              </div>

              <div className="relative border-l border-slate-800/80 ml-3 space-y-8 pl-6">
                {selectedDay.activities.map((activity, actIdx) => (
                  <div key={actIdx} className="relative group">
                    {/* Time dot connector */}
                    <div className="absolute left-[-31px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-brand-500 group-hover:border-accent-500 transition-colors flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white group-hover:bg-accent-400"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {activity.time && (
                          <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 flex items-center gap-1">
                            <Clock size={11} />
                            {activity.time}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1.5 ${getCategoryStyles(activity.category)}`}>
                          {getCategoryIcon(activity.category)}
                          {activity.category}
                        </span>
                      </div>

                      <h4 className="font-display font-semibold text-base text-white">{activity.title}</h4>
                      <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{activity.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {activity.location}
                          </span>
                        )}
                        {activity.cost && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-brand-400">₹</span>
                            {formatRawCost(activity.cost)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tips & Recommendations (Right Column) */}
        <div className="space-y-6">
          {/* General Tips Card */}
          {itinerary.tips && itinerary.tips.length > 0 && (
            <div className="glass rounded-3xl border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <h3 className="font-display font-bold text-base text-white">Curated AI Travel Tips</h3>
              </div>
              <ul className="space-y-3">
                {itinerary.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs md:text-sm text-slate-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-2"></span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Share Code */}
          <div className="glass rounded-3xl border-white/5 p-6 text-center space-y-4">
            <h3 className="font-display font-semibold text-sm text-white">Need to collaborate?</h3>
            <p className="text-slate-400 text-xs leading-normal">
              Toggle public access to share this interactive itinerary with friends, family, or trip companions.
            </p>
            {!itinerary.isPublic && (
              <button 
                onClick={handleToggleShare}
                className="btn-ghost w-full py-2.5 text-xs text-brand-300 border-brand-500/20 hover:bg-brand-500/5"
              >
                Enable Public Sharing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
