import React from 'react';
import { 
  X, 
  Share2, 
  Star, 
  Edit3, 
  Download, 
  ExternalLink, 
  Trash2,
  Play
} from 'lucide-react';

export default function VideoActionSheet({ 
  isOpen, 
  video, 
  onClose, 
  onShare, 
  onToggleFavorite, 
  onOpenRename, 
  onDelete,
  onPlay 
}) {
  if (!isOpen || !video) return null;

  const isLocal = video.type === 'local';
  const isFavorite = !!video.favorite;

  const handleDownload = () => {
    onClose();
    if (isLocal && video.videoBlob) {
      const url = URL.createObjectURL(video.videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle on Mobile */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Video Header Card */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div 
            onClick={() => {
              onClose();
              onPlay(video);
            }}
            className="relative w-16 h-12 bg-slate-950 rounded-xl overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center cursor-pointer group"
          >
            {video.thumbnail ? (
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            ) : (
              <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="w-4 h-4 fill-white text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {video.title || 'Untitled Video'}
            </h3>
            <p className="text-xs text-slate-400 capitalize">
              {video.source} • {video.size || 'Web Link'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action List */}
        <div className="mt-3 space-y-1">
          {/* Share Video */}
          <button
            onClick={() => {
              onClose();
              onShare(video);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-slate-800 active:bg-slate-800/80 text-left transition font-semibold text-sm text-emerald-400"
          >
            <Share2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Share Video (WhatsApp, SMS...)</span>
          </button>

          {/* Toggle Favorite */}
          <button
            onClick={() => {
              onClose();
              onToggleFavorite(video.id);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-slate-800 active:bg-slate-800/80 text-left transition font-semibold text-sm text-slate-200"
          >
            <Star className={`w-5 h-5 shrink-0 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
            <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
          </button>

          {/* Rename */}
          <button
            onClick={() => {
              onClose();
              onOpenRename(video);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-slate-800 active:bg-slate-800/80 text-left transition font-semibold text-sm text-slate-200"
          >
            <Edit3 className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>Rename Video</span>
          </button>

          {/* Download (for local files) */}
          {isLocal && (
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-slate-800 active:bg-slate-800/80 text-left transition font-semibold text-sm text-slate-200"
            >
              <Download className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Download / Save to Device</span>
            </button>
          )}

          {/* Open Original Link (for external links) */}
          {!isLocal && video.url && (
            <button
              onClick={() => {
                onClose();
                window.open(video.url, '_blank', 'noopener,noreferrer');
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-slate-800 active:bg-slate-800/80 text-left transition font-semibold text-sm text-slate-200"
            >
              <ExternalLink className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Open Original Link</span>
            </button>
          )}

          <div className="my-2 border-t border-slate-800" />

          {/* Delete */}
          <button
            onClick={() => {
              onClose();
              onDelete(video.id);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-red-950/40 active:bg-red-950/60 text-left transition font-semibold text-sm text-red-400"
          >
            <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
            <span>Delete Video</span>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="mt-3 pt-2 sm:hidden">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-700 font-bold text-sm text-slate-300 rounded-2xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
