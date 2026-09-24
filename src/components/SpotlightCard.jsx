import React, { useState, useEffect } from 'react';
import { Play, Shuffle, X, Sparkles, ExternalLink } from 'lucide-react';

export default function SpotlightCard({ videos, onPlay }) {
  const [featured, setFeatured] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!videos || videos.length === 0) {
      setFeatured(null);
      return;
    }

    // Pick featured video based on day of year
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % videos.length;
    setFeatured(videos[index]);
  }, [videos]);

  const handleShuffle = (e) => {
    e.stopPropagation();
    if (!videos || videos.length <= 1) return;
    const randomIndex = Math.floor(Math.random() * videos.length);
    setFeatured(videos[randomIndex]);
  };

  if (isDismissed || !featured) return null;

  const isLocal = featured.type === 'local' || featured.source === 'gallery';

  return (
    <div className="mb-6 relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-cyan-950/30 border border-indigo-500/30 p-4 sm:p-5 shadow-xl shadow-indigo-500/5 backdrop-blur-sm overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Side: Thumbnail Preview */}
        <div 
          onClick={() => onPlay(featured)}
          className="relative w-full sm:w-48 aspect-video sm:aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden cursor-pointer group shrink-0 border border-slate-700 shadow-md"
        >
          {featured.thumbnail ? (
            <img 
              src={featured.thumbnail} 
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-cyan-400">
              <Sparkles className="w-8 h-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition-colors">
            <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        {/* Middle: Details */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Daily Spotlight
            </span>
            <span className="text-[11px] text-indigo-300 font-semibold">
              Featured Pick
            </span>
          </div>

          <h3 
            onClick={() => onPlay(featured)}
            className="text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition cursor-pointer line-clamp-2"
          >
            {featured.title || 'Featured Video'}
          </h3>

          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {featured.description || 'Watch and enjoy your saved video.'}
          </p>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
          <button
            onClick={handleShuffle}
            title="Pick another random video"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <Shuffle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          <button
            onClick={() => onPlay(featured)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            {isLocal ? <Play className="w-4 h-4 fill-current" /> : <ExternalLink className="w-4 h-4" />}
            <span>Watch Video</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss spotlight"
            className="p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
