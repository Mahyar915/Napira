import React from 'react';
import { CheckSquare, Square, Star, Trash2, X } from 'lucide-react';

export default function BatchActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onBatchFavorite,
  onBatchDelete,
  onCancel,
}) {
  const allSelected = selectedCount > 0 && selectedCount === totalCount;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-40 animate-in slide-in-from-bottom duration-200">
      <div className="bg-slate-900/95 border-2 border-cyan-500/50 backdrop-blur-xl rounded-2xl sm:rounded-full px-4 py-3 shadow-2xl shadow-cyan-500/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 max-w-xl mx-auto">
        {/* Count & Select All */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 px-2.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 transition"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4 text-slate-400" />}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
          <span className="text-xs font-semibold text-slate-300">
            <strong className="text-cyan-400">{selectedCount}</strong> / {totalCount} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Batch Favorite */}
          <button
            onClick={() => onBatchFavorite(true)}
            disabled={selectedCount === 0}
            title="Add selected to Favorites"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="hidden sm:inline">Favorite</span>
          </button>

          {/* Batch Delete */}
          <button
            onClick={onBatchDelete}
            disabled={selectedCount === 0}
            title="Delete selected videos"
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete ({selectedCount})</span>
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            title="Exit selection mode"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
