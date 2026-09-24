import React from 'react';
import { ClipboardCheck, Plus, X, Instagram, Facebook } from 'lucide-react';

export default function ClipboardBanner({ copiedUrl, onAdd, onDismiss }) {
  if (!copiedUrl) return null;

  const isInstagram = copiedUrl.includes('instagram.com');
  const isFacebook = copiedUrl.includes('facebook.com');

  return (
    <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900/90 border-b border-indigo-500/50 px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center shrink-0 text-white shadow-md">
            {isInstagram ? (
              <Instagram className="w-5 h-5 text-pink-300" />
            ) : isFacebook ? (
              <Facebook className="w-5 h-5 text-blue-300" />
            ) : (
              <ClipboardCheck className="w-5 h-5 text-indigo-200" />
            )}
          </div>
          <div className="truncate">
            <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>New Copied Link Detected!</span>
            </p>
            <p className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md">
              {copiedUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => onAdd(copiedUrl)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Vault</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
