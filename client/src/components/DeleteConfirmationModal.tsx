import React, { useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, Calendar, MapPin, X } from 'lucide-react';
import type { Itinerary } from '@/types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itinerary: Itinerary | null;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itinerary,
  isDeleting = false
}: DeleteConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle focus trapping and restoration
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Auto-focus on the cancel button (safer default)
      setTimeout(() => {
        const cancelButton = modalRef.current?.querySelector('[data-autofocus]') as HTMLElement;
        if (cancelButton) {
          cancelButton.focus();
        }
      }, 50);
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Handle Escape key and Tab focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !itinerary) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800/80 bg-surface-800/95 shadow-2xl transition-all duration-300 animate-scale-in"
      >
        {/* Header decoration */}
        <div className="relative h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600"></div>

        {/* Modal content */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <h3
                id="delete-modal-title"
                className="font-display font-bold text-xl text-white tracking-tight"
              >
                Delete Itinerary?
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description / Information */}
          <div id="delete-modal-description" className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>You are about to permanently delete:</p>
            
            {/* Itinerary Specs Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <MapPin size={14} className="text-brand-400" />
                <span className="truncate">{itinerary.destination}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Calendar size={14} className="text-slate-500" />
                <span>{itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>

            <p className="text-rose-400/90 font-medium flex items-center gap-1.5 pt-1">
              <span>This action cannot be undone.</span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              data-autofocus
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-sm font-semibold border border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-all focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20 hover:shadow-rose-950/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 focus:outline-none"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Delete Permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
