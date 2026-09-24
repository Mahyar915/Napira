import React from 'react';
import { 
  ClipboardPaste, 
  Upload, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Tv, 
  Repeat, 
  Globe 
} from 'lucide-react';

export default function WelcomeHero({ onPaste, onAddLink, onUpload }) {
  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-indigo-950/20 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-0 left-1/4 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Universal Video & Media Vault</span>
        </div>

        {/* Main Marketing Headline */}
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          Save, Organize & Stream Videos from <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
            Instagram, TikTok, YouTube & Your Device
          </span>
        </h2>

        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Your personal offline-ready vault. Save favorite reels, tutorials, and workout clips from all social platforms, or upload files directly from your phone or computer.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 sm:mt-7">
          <button
            onClick={onPaste}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition"
          >
            <ClipboardPaste className="w-4 h-4 text-emerald-100" />
            <span>Paste Link</span>
          </button>

          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition"
          >
            <Upload className="w-4 h-4 text-indigo-100" />
            <span>Upload from Device</span>
          </button>

          <button
            onClick={onAddLink}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold text-xs sm:text-sm rounded-2xl border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Link Manually</span>
          </button>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800/80 text-left">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">All Platforms</h4>
              <p className="text-[11px] text-slate-400">IG, TikTok, YouTube, FB & Web</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Phone & PC</h4>
              <p className="text-[11px] text-slate-400">Offline playback with thumbnails</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <Repeat className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">Slow-Mo & Loop</h4>
              <p className="text-[11px] text-slate-400">0.25x - 1x speed & drill loop</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <Tv className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">TV Cast / PiP</h4>
              <p className="text-[11px] text-slate-400">Pop-out video & AirPlay ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
