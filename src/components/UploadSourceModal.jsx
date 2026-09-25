import React, { useState } from 'react';
import { X, Image, Zap, Info, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

export default function UploadSourceModal({ 
  isOpen, 
  onClose, 
  onSelectPhotoLibrary, 
  onSelectFilesApp 
}) {
  const [showIosTip, setShowIosTip] = useState(false);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col max-h-[85dvh] sm:max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Top Header with Drag Handle & Unmistakable Close / Back Button */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-5 pt-3 pb-3 border-b border-slate-800 shrink-0">
          {/* Top Drag Handle on Mobile (tap to close) */}
          <div 
            onClick={onClose}
            className="w-12 h-1.5 bg-slate-700 hover:bg-slate-500 rounded-full mx-auto mb-3 cursor-pointer transition"
            title="Tap to close"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={onClose}
                title="Back / Close"
                className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 active:scale-95 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300 sm:hidden">Back</span>
              </button>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Import Videos
                </h3>
                <p className="text-[11px] text-slate-400">
                  Choose where to pick videos from
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              title="Close modal"
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 active:scale-90 transition border border-slate-700/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3.5">
          {/* Option 1: Files App (Ultra-Fast 0s Import) */}
          <button
            onClick={() => {
              onClose();
              onSelectFilesApp();
            }}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 hover:from-cyan-900/60 hover:to-indigo-900/60 border border-cyan-500/40 active:scale-[0.98] transition flex items-start gap-3.5 group shadow-lg shadow-cyan-950/30"
          >
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 group-hover:scale-105 transition">
              <Zap className="w-6 h-6 fill-cyan-400/20" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm sm:text-base">Files App / Device Storage</span>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Instant ⚡
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct raw import without waiting for iCloud download or video conversion. Exactly as fast as computer!
              </p>
            </div>
          </button>

          {/* Option 2: Photo Library / Camera Roll */}
          <button
            onClick={() => {
              onClose();
              onSelectPhotoLibrary();
            }}
            className="w-full text-left p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 active:scale-[0.98] transition flex items-start gap-3.5 group"
          >
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 group-hover:scale-105 transition">
              <Image className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm sm:text-base">Photo Library (Gallery)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Select from your Camera Roll. <span className="text-amber-400/90">(If video is in iCloud, iOS downloads it first).</span>
              </p>
            </div>
          </button>

          {/* Educational Accordion: Why does iPhone Photo Library load? */}
          <div className="pt-2">
            <button
              onClick={() => setShowIosTip(!showIosTip)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-400 hover:text-cyan-400 transition py-2 px-1 rounded-lg hover:bg-slate-800/40"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Why does iPhone Gallery load before importing?</span>
              </span>
              {showIosTip ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
            </button>

            {showIosTip && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2.5 leading-relaxed animate-in fade-in duration-150">
                <p>
                  <strong className="text-slate-100 font-semibold">1. Apple iCloud Storage:</strong> By default, iPhones keep full-resolution videos in Apple's cloud servers (to save phone space). When you tap a video in the Photos gallery, <em>iOS must download it from iCloud</em> before giving it to any app.
                </p>
                <p>
                  <strong className="text-slate-100 font-semibold">2. 4K/HDR Conversion:</strong> iPhones record in HEVC/ProRes. The Photos app converts them on-the-fly before releasing them to the browser.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-cyan-300 font-medium">
                  💡 <strong>How to make it instant like PC:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-300">
                    <li>Use <strong>Files App</strong> above (save video to Files, then pick it).</li>
                    <li>In iPhone <strong>Settings &gt; iCloud &gt; Photos</strong>, select <strong>"Download and Keep Originals"</strong>.</li>
                    <li>In iPhone <strong>Settings &gt; Camera &gt; Formats</strong>, select <strong>"Most Compatible"</strong>.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Close / Cancel Button */}
        <div className="sticky bottom-0 z-10 bg-slate-900/95 backdrop-blur-md px-5 py-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-700 transition"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
}
