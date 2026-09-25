import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ExternalLink, 
  Smartphone, 
  Instagram, 
  Facebook, 
  Youtube, 
  Globe, 
  Clock, 
  Star, 
  MoreVertical,
  Check
} from 'lucide-react';
import { formatDuration, generateVideoThumbnail } from '../utils/thumbnail';

function TikTokIcon({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.9-4.48V8.71a8.21 8.21 0 0 0 4.87 1.6V6.86a4.86 4.86 0 0 1-1-.17z"/>
    </svg>
  );
}

export default function VideoCard({ 
  video, 
  onPlay, 
  onToggleFavorite, 
  viewMode,
  onOpenActionSheet,
  isSelectionMode,
  isSelected,
  onToggleSelect
}) {
  const [imgError, setImgError] = useState(false);
  const isLocal = video.type === 'local';
  const isFavorite = !!video.favorite;
  const isGiant = viewMode === 'giant';
  const [localBlobUrl, setLocalBlobUrl] = useState(null);

  // Auto-create blob URL for local files
  useEffect(() => {
    if (isLocal && video.videoBlob) {
      const url = URL.createObjectURL(video.videoBlob);
      setLocalBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [isLocal, video.videoBlob]);

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelect?.(video.id);
      return;
    }
    if (isLocal) {
      onPlay(video);
    } else if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(30);
    onToggleFavorite(video.id);
  };

  const handleOptionsClick = (e) => {
    e.stopPropagation();
    onOpenActionSheet?.(video);
  };

  const getSourceBadge = () => {
    const badgeTextSize = isGiant ? 'text-xs' : 'text-[11px]';
    if (isLocal) {
      return (
        <span className={`flex items-center gap-1 bg-indigo-600 text-white ${badgeTextSize} font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Smartphone className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Device
        </span>
      );
    }
    if (video.source === 'tiktok' || video.url?.includes('tiktok.com')) {
      return (
        <span className={`flex items-center gap-1 bg-black text-cyan-300 border border-cyan-400/40 ${badgeTextSize} font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <TikTokIcon className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          TikTok
        </span>
      );
    }
    if (video.source === 'youtube' || video.url?.includes('youtu')) {
      return (
        <span className={`flex items-center gap-1 bg-red-600 text-white ${badgeTextSize} font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Youtube className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          YouTube
        </span>
      );
    }
    if (video.source === 'instagram' || video.url?.includes('instagram.com')) {
      return (
        <span className={`flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white ${badgeTextSize} font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Instagram className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Instagram
        </span>
      );
    }
    if (video.source === 'facebook' || video.url?.includes('facebook.com')) {
      return (
        <span className={`flex items-center gap-1 bg-blue-600 text-white ${badgeTextSize} font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Facebook className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Facebook
        </span>
      );
    }
    return (
      <span className={`flex items-center gap-1 bg-slate-700 text-slate-200 ${badgeTextSize} font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
        <Globe className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        Web
      </span>
    );
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative bg-slate-900 border transition-all duration-200 flex flex-col cursor-pointer active:scale-[0.99] overflow-hidden ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-400/10'
          : isFavorite
          ? 'border-amber-500/70 ring-1 ring-amber-500/40'
          : 'border-slate-800 hover:border-slate-700'
      } ${isGiant ? 'rounded-3xl shadow-xl' : 'rounded-2xl shadow-md'}`}
    >
      {/* Thumbnail Area */}
      <div className={`relative ${isGiant ? 'aspect-video' : 'aspect-[16/10]'} bg-slate-950 overflow-hidden flex items-center justify-center`}>
        {video.thumbnail && !imgError ? (
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : localBlobUrl ? (
          <video 
            src={`${localBlobUrl}#t=0.5`}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 p-4 text-center">
            {isLocal ? (
              <Smartphone className="w-10 h-10 text-indigo-400 mb-1" />
            ) : video.source === 'youtube' || video.url?.includes('youtu') ? (
              <Youtube className="w-10 h-10 text-red-500 mb-1" />
            ) : video.source === 'instagram' || video.url?.includes('instagram.com') ? (
              <Instagram className="w-10 h-10 text-pink-400 mb-1" />
            ) : (
              <Facebook className="w-10 h-10 text-blue-400 mb-1" />
            )}
            <span className="text-xs text-slate-400 font-medium">No Thumbnail</span>
          </div>
        )}

        {/* Selection Checkbox (Shown in Select Mode) */}
        {isSelectionMode ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(video.id);
            }}
            className={`absolute top-2 left-2 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${
              isSelected 
                ? 'bg-cyan-400 text-slate-950 scale-105 ring-2 ring-white/50' 
                : 'bg-black/60 text-transparent border-2 border-white/60 hover:border-cyan-400'
            }`}
          >
            <Check className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[3] ${isSelected ? 'block' : 'hidden'}`} />
          </div>
        ) : (
          /* Normal Top Badges */
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            {getSourceBadge()}
            <div className="flex items-center gap-1">
              {video.isProcessing ? (
                <span className={`flex items-center gap-1 bg-cyan-400 text-slate-950 ${isGiant ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5'} font-extrabold rounded backdrop-blur-sm shadow animate-pulse`}>
                  Optimizing...
                </span>
              ) : video.duration ? (
                <span className={`flex items-center gap-0.5 bg-black/80 text-white ${isGiant ? 'text-xs px-2 py-1' : 'text-[10px] px-1.5 py-0.5'} font-semibold rounded backdrop-blur-sm`}>
                  <Clock className={isGiant ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
                  {formatDuration(video.duration)}
                </span>
              ) : null}
            </div>
          </div>
        )}

        {/* Direct Favorite Star Button (Hidden in selection mode) */}
        {!isSelectionMode && (
          <button
            onClick={handleStarClick}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            className={`absolute top-2 right-2 z-20 ${isGiant ? 'w-11 h-11' : 'w-9 h-9'} rounded-full flex items-center justify-center transition backdrop-blur-md ${
              isFavorite 
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 scale-105' 
                : 'bg-black/60 text-slate-300 hover:text-amber-400 hover:bg-black/80'
            }`}
          >
            <Star className={`${isGiant ? 'w-6 h-6' : 'w-5 h-5'} ${isFavorite ? 'fill-slate-950 stroke-slate-950' : 'stroke-current'}`} />
          </button>
        )}

        {/* Center Play Button Overlay */}
        {!isSelectionMode && (
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
            <div className={`${isGiant ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform`}>
              {isLocal ? (
                <Play className={`${isGiant ? 'w-8 h-8' : 'w-6 h-6'} fill-current ml-0.5`} />
              ) : (
                <ExternalLink className={isGiant ? 'w-7 h-7' : 'w-5 h-5'} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info & Title Area */}
      <div className={`${isGiant ? 'p-4 sm:p-5' : 'p-3 sm:p-3.5'} flex-1 flex flex-col justify-between relative`}>
        <div>
          <h3 className={`${isGiant ? 'text-base sm:text-lg font-black' : 'text-xs sm:text-sm font-bold'} text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug`}>
            {video.title || 'Untitled Video'}
          </h3>
          {video.description && isGiant && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {video.description}
            </p>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-xs">
          <span className="text-[11px] text-slate-500">
            {isLocal ? 'Tap to play' : 'Tap to open'}
          </span>

          {/* 3-Dots Button: Opens root Action Sheet (Never clipped!) */}
          {!isSelectionMode && (
            <button
              onClick={handleOptionsClick}
              title="More Options"
              className="p-2 -mr-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-95"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
