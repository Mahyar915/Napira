import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Check } from 'lucide-react';

export default function RenameModal({ isOpen, video, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && video) {
      setTitle(video.title || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (cleanTitle && cleanTitle !== video.title) {
      onSave(video.id, cleanTitle);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              Rename Video
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Video Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter new title..."
              className="w-full px-4 py-3 bg-slate-800 text-slate-100 text-sm sm:text-base rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded-xl shadow-lg shadow-cyan-400/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
