import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { itineraryService } from '@/services/itineraryService';
import { useToast } from '@/hooks/useToast';
import { useRenderWakeUpWarning } from '@/hooks/useRenderWakeUpWarning';
import { 
  Sparkles, 
  UploadCloud, 
  MapPin, 
  Calendar, 
  FileText,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const INTERESTS = ['Food & Dining', 'Historical Sites', 'Nature & Outdoors', 'Art & Museums', 'Shopping', 'Nightlife', 'Relaxation', 'Adventure Sports', 'Family Friendly'];
const BUDGETS = ['Budget', 'Moderate', 'Luxury'];
const TRAVEL_STYLES = ['Relaxed', 'Packed / Fast-paced', 'Balanced', 'Adventure'];

const LOADING_STEPS = [
  'Reading your preferences...',
  'Extracting details from uploaded files...',
  'Consulting AI Travel Expert engine...',
  'Curating daily itineraries, routing, and timings...',
  'Estimating budgets & writing custom tips...',
  'Polishing itinerary design...'
];

export default function GenerateItinerary() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const { startWarningTimer, clearWarningTimer } = useRenderWakeUpWarning(addToast);
  const [activeTab, setActiveTab] = useState<'form' | 'upload'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [loadStepIdx, setLoadStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    destination: '',
    duration: 3,
    budget: 'Moderate',
    travelStyle: 'Balanced',
    interests: [] as string[],
    startDate: '',
    additionalNotes: ''
  });

  // Dropzone State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // Run progress timer simulation when loading
  const startLoadingAnimation = () => {
    setIsLoading(true);
    setLoadStepIdx(0);
    const interval = setInterval(() => {
      setLoadStepIdx(prev => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4500);
    return interval;
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.destination) {
      setError('Please provide a destination.');
      return;
    }

    const interval = startLoadingAnimation();
    setError(null);
    startWarningTimer();

    try {
      const result = await itineraryService.generate({
        destination: formData.destination,
        duration: Number(formData.duration),
        budget: formData.budget,
        travelStyle: formData.travelStyle,
        interests: formData.interests,
        startDate: formData.startDate || undefined,
        additionalNotes: formData.additionalNotes || undefined
      });
      clearInterval(interval);
      
      const itineraryId = result?._id;
      if (!itineraryId) {
        console.error('[GenerateItinerary] Missing _id in response. Full result:', result);
        setIsLoading(false);
        const friendlyMsg = 'The AI service is currently busy. Please try again in a few moments.';
        setError(friendlyMsg);
        addToast(friendlyMsg, 'error');
        return;
      }

      navigate(`/itinerary/${itineraryId}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      const friendlyMsg = 'The AI service is currently busy. Please try again in a few moments.';
      setError(friendlyMsg);
      addToast(friendlyMsg, 'error');
    } finally {
      clearWarningTimer();
    }
  };

  const handleFileUploadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uploadedFile) {
      setError('Please upload a travel document.');
      return;
    }

    const interval = startLoadingAnimation();
    setError(null);
    startWarningTimer();

    try {
      const formPayload = new FormData();
      // Must match multer's field name: upload.array("files", 5) in upload.middleware.js
      console.log('[GenerateItinerary] Appending file to FormData with field name: "files"');
      formPayload.append('files', uploadedFile);
      const result = await itineraryService.generateFromFile(formPayload);

      // Debug: confirm the shape of the returned object before navigating
      console.log('[GenerateItinerary] generateFromFile result:', result);
      console.log('[GenerateItinerary] Itinerary _id:', result?._id);

      clearInterval(interval);

      const itineraryId = result?._id;
      if (!itineraryId) {
        console.error('[GenerateItinerary] Missing _id in response. Full result:', result);
        setIsLoading(false);
        const friendlyMsg = 'The AI service is currently busy. Please try again in a few moments.';
        setError(friendlyMsg);
        addToast(friendlyMsg, 'error');
        return;
      }

      navigate(`/itinerary/${itineraryId}`);
    } catch (err: any) {
      clearInterval(interval);
      setIsLoading(false);
      
      const isValidationError = err.response?.status === 400 && 
        (err.response?.data?.message?.includes("No travel booking information") || 
         err.response?.data?.message?.includes("travel booking information"));

      if (isValidationError) {
        const friendlyMsg = "Unable to identify travel booking information.\n\nPlease upload:\n• Flight tickets\n• Hotel bookings\n• Train tickets\n• Travel reservations";
        setError(friendlyMsg);
        addToast("Unable to identify travel booking information.", 'error');
      } else {
        const friendlyMsg = 'The AI service is currently busy. Please try again in a few moments.';
        setError(friendlyMsg);
        addToast(friendlyMsg, 'error');
      }
    } finally {
      clearWarningTimer();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
        <div className="glass max-w-xl w-full p-10 rounded-3xl border-white/5 shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
          {/* Neon Glow Overlay */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl animate-pulse-glow"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-accent-500/20 blur-3xl animate-pulse-glow"></div>

          <div className="relative">
            <div className="w-20 h-20 rounded-full border-[3px] border-brand-500/10 border-t-brand-500 animate-spin flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-2xl text-white">We're building your trip...</h3>
            <p className="text-brand-400 text-sm font-semibold tracking-wide uppercase h-6">
              {LOADING_STEPS[loadStepIdx]}
            </p>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-brand-500 to-accent-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${((loadStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-1.5 pt-4 text-xs text-slate-500 text-left max-w-sm">
            {LOADING_STEPS.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                  idx < loadStepIdx ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                  idx === loadStepIdx ? 'border-brand-500 text-brand-400 animate-pulse' :
                  'border-slate-800 text-slate-700'
                }`}>
                  {idx < loadStepIdx ? <CheckCircle size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                </div>
                <span className={idx === loadStepIdx ? 'text-slate-200 font-medium' : idx < loadStepIdx ? 'text-slate-400' : 'text-slate-600'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight leading-none mb-2">
          Plan a New Adventure
        </h1>
        <p className="text-slate-400 text-sm">
          Select preferences or upload travel documents to customize your daily itinerary.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="font-medium whitespace-pre-line">{error}</span>
          <button
            type="button"
            onClick={() => activeTab === 'form' ? handleFormSubmit() : handleFileUploadSubmit()}
            className="btn-primary py-1.5 px-4 text-xs font-bold shrink-0 self-start sm:self-center bg-rose-600 hover:bg-rose-500 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl max-w-sm border border-slate-800/40">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${
            activeTab === 'form' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Preferences Form
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${
            activeTab === 'upload' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Upload Bookings / OCR
        </button>
      </div>

      {activeTab === 'form' ? (
        <form onSubmit={handleFormSubmit} className="glass p-6 md:p-8 rounded-3xl border-white/5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" size={18} />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Paris, Tokyo, Bali..."
                  className="input-base pl-11"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duration (Days)</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none" size={18} />
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="input-base pl-11"
                  required
                />
              </div>
            </div>

            {/* Travel Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Budget Range</label>
              <div className="grid grid-cols-3 gap-3">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, budget: b })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      formData.budget === b 
                        ? 'bg-brand-500 border-brand-400 text-white'
                        : 'border-slate-800/80 hover:border-slate-600 bg-slate-800/20 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Style */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pacing / Style</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setFormData({ ...formData, travelStyle: style })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      formData.travelStyle === style 
                        ? 'bg-brand-500 border-brand-400 text-white'
                        : 'border-slate-800/80 hover:border-slate-600 bg-slate-800/20 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {style.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Areas of Interest</label>
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS.map((interest) => {
                const selected = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`py-2 px-3.5 rounded-full border text-xs font-medium transition-all ${
                      selected 
                        ? 'bg-brand-500/25 border-brand-500/60 text-brand-300'
                        : 'border-slate-850 bg-slate-800/20 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Custom Prompts / Notes (Optional)</label>
            <textarea
              rows={3}
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="e.g. Traveling with kids, focusing on vegetarian cuisine, need wheelchair access, start with early morning schedules..."
              className="input-base resize-none"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button type="submit" className="btn-primary px-8">
              <Sparkles size={16} />
              Generate Itinerary
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFileUploadSubmit} className="glass p-6 md:p-8 rounded-3xl border-white/5 space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-display font-semibold text-lg text-white">Extract from Bookings</h3>
            <p className="text-slate-400 text-xs md:text-sm">
              Upload documents (PDF flight itinerary, booking reservation emails, text files) and our AI will translate them into an actionable, daily itinerary.
            </p>
          </div>

          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-brand-500 bg-brand-500/5' 
                : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/10'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <UploadCloud size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Drag & drop files or click to browse</p>
                <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, TXT and image documents up to 10MB</p>
              </div>
            </div>
          </div>

          {uploadedFile && (
            <div className="flex items-center justify-between p-3.5 bg-slate-800/30 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-sm">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setUploadedFile(null)} 
                className="p-1 rounded-lg text-slate-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button 
              type="submit" 
              disabled={!uploadedFile}
              className="btn-primary px-8"
            >
              <Sparkles size={16} />
              Build Itinerary
            </button>
          </div>
        </form>
      )}
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
                <CheckCircle size={16} className="text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="text-rose-400" />
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
