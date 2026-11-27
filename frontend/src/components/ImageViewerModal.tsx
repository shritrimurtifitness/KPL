import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, User, Receipt } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  type?: 'photo' | 'screenshot';
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  badge,
  type = 'screenshot',
}) => {
  const [zoomed, setZoomed] = useState(false);

  // Reset zoom whenever modal opens with a new image
  useEffect(() => {
    if (isOpen) {
      setZoomed(false);
    }
  }, [isOpen, imageUrl]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-[#131B2E] border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              {type === 'photo' ? (
                <User className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Receipt className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              {badge && (
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded shrink-0">
                  {badge}
                </span>
              )}
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Zoom In/Out Button */}
            <button
              type="button"
              onClick={() => setZoomed(!zoomed)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              title={zoomed ? 'Zoom Out' : 'Zoom In'}
            >
              {zoomed ? (
                <>
                  <ZoomOut className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">1x</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Zoom</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-200 text-slate-300 rounded-lg transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area with Touch & Zoom Support */}
        <div className="flex-1 overflow-auto rounded-xl bg-slate-950 border border-slate-800/80 p-2 flex items-center justify-center min-h-[50vh] max-h-[78vh]">
          <img
            src={imageUrl}
            alt={title}
            onClick={() => setZoomed(!zoomed)}
            className={`max-w-full rounded object-contain transition-transform duration-200 select-none ${
              zoomed
                ? 'scale-175 sm:scale-150 cursor-zoom-out'
                : 'max-h-[74vh] w-auto cursor-zoom-in'
            }`}
          />
        </div>

        {/* Footer */}
        <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 truncate">
            {zoomed
              ? 'Zoomed view. Drag or scroll to inspect details.'
              : 'Tap or click image to zoom in.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
