import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Smartphone, 
  Instagram, 
  Facebook, 
  Youtube,
  Globe,
  Clock,
  HardDrive,
  Star,
  MoreVertical,
  Share2
} from 'lucide-react';
import { formatDuration, generateVideoThumbnail } from '../utils/thumbnail';

function TikTokIcon({ className = "w-3 h-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.9-4.48V8.71a8.21 8.21 0 0 0 4.87 1.6V6.86a4.86 4.86 0 0 1-1-.17z"/>
    </svg>
  );
}

export default function VideoCard({ video, onPlay, onRename, onDelete, onToggleFavorite, viewMode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(video.title || '');
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef(null);

  const isLocal = video.type === 'local';
  const isFavorite = !!video.favorite;
  const isGiant = viewMode === 'giant';
  const [localBlobUrl, setLocalBlobUrl] = useState(null);

  // Auto-create blob URL and auto-repair thumbnail if missing or black
  useEffect(() => {
    if (isLocal && video.videoBlob) {
      const url = URL.createObjectURL(video.videoBlob);
      setLocalBlobUrl(url);

      // If thumbnail is missing or tiny placeholder, auto-generate high-quality thumbnail
      if (!video.thumbnail || video.thumbnail.length < 50) {
        generateVideoThumbnail(video.videoBlob, 1.5).then(({ thumbnail, duration }) => {
          if (thumbnail && onRename) {
            onRename(video.id, video.title, { thumbnail, duration: duration || video.duration });
          }
        });
      }

      return () => URL.revokeObjectURL(url);
    }
  }, [isLocal, video.id, video.videoBlob, video.thumbnail, video.title, onRename]);

  // Auto-repair missing thumbnail for external links (YouTube, Instagram, Facebook, etc.)
  useEffect(() => {
    if (!isLocal && !video.thumbnail && video.url && onRename) {
      // 1. Direct YouTube match (immediate, no network wait)
      const ytMatch = video.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        onRename(video.id, video.title, {
          thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
          source: 'youtube'
        });
        return;
      }

      // 2. Fetch scrape API for Instagram / Facebook / Web
      fetch(`/api/scrape?url=${encodeURIComponent(video.url)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.thumbnail) {
            onRename(video.id, video.title, {
              thumbnail: data.thumbnail,
              description: data.description || video.description,
              title: (video.title?.includes('Video') || !video.title) && data.title ? data.title : video.title,
              source: data.source || video.source
            });
          }
        })
        .catch((err) => console.warn('Background link scrape error:', err));
    }
  }, [isLocal, video.id, video.url, video.thumbnail, video.title, video.description, video.source, onRename]);

  // Close 3-dots dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = () => {
    if (showMenu) {
      setShowMenu(false);
      return;
    }
    if (isLocal) {
      onPlay(video);
    } else if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveTitle = (e) => {
    e.stopPropagation();
    if (tempTitle.trim() && tempTitle !== video.title) {
      onRename(video.id, tempTitle.trim());
    }
    setIsEditing(false);
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(30);
    onToggleFavorite(video.id);
  };

  // Share via WhatsApp, Messages, Instagram, etc.
  const handleShareVideo = async () => {
    setShowMenu(false);
    if (navigator.share) {
      try {
        if (isLocal && video.videoBlob) {
          const cleanFileName = (video.title || 'video').replace(/[^a-zA-Z0-9_-]/g, '_') + '.mp4';
          const file = new File([video.videoBlob], cleanFileName, { type: video.videoBlob.type || 'video/mp4' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: video.title || 'Video',
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: video.title || 'Napira',
          text: video.title || '',
          url: video.url || window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    } else {
      if (video.url) {
        await navigator.clipboard.writeText(video.url);
        alert('Video link copied to clipboard!');
      } else {
        alert('Direct sharing is supported on your mobile phone.');
      }
    }
  };

  const getSourceBadge = () => {
    const badgeTextSize = isGiant ? 'text-xs' : 'text-[11px]';
    if (isLocal) {
      return (
        <span className={`flex items-center gap-1 bg-indigo-600 text-white ${badgeTextSize} font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Smartphone className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Device
        </span>
      );
    }
    if (video.source === 'tiktok' || video.url?.includes('tiktok.com')) {
      return (
        <span className={`flex items-center gap-1 bg-black text-cyan-300 border border-cyan-400/40 ${badgeTextSize} font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <TikTokIcon className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          TikTok
        </span>
      );
    }
    if (video.source === 'youtube' || video.url?.includes('youtu')) {
      return (
        <span className={`flex items-center gap-1 bg-red-600 text-white ${badgeTextSize} font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Youtube className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          YouTube
        </span>
      );
    }
    if (video.source === 'instagram' || video.url?.includes('instagram.com')) {
      return (
        <span className={`flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white ${badgeTextSize} font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Instagram className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Instagram
        </span>
      );
    }
    if (video.source === 'facebook' || video.url?.includes('facebook.com')) {
      return (
        <span className={`flex items-center gap-1 bg-blue-600 text-white ${badgeTextSize} font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
          <Facebook className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Facebook
        </span>
      );
    }
    return (
      <span className={`flex items-center gap-1 bg-slate-700 text-slate-200 ${badgeTextSize} font-bold px-2.5 py-0.5 rounded-md backdrop-blur-sm shadow-md`}>
        <Globe className={isGiant ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        Web
      </span>
    );
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative bg-slate-900 border ${
        isFavorite ? 'border-amber-500/70 ring-1 ring-amber-500/40' : 'border-slate-800'
      } hover:border-amber-500/50 ${
        isGiant ? 'rounded-3xl shadow-xl' : 'rounded-2xl shadow-md'
      } overflow-hidden hover:shadow-2xl transition-all duration-200 flex flex-col cursor-pointer active:scale-[0.99]`}
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
            src={`${localBlobUrl}#t=1.5`}
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

        {/* Top Badges (Source & Duration) */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {getSourceBadge()}
          <div className="flex items-center gap-1">
            {video.duration ? (
              <span className={`flex items-center gap-0.5 bg-black/80 text-white ${isGiant ? 'text-xs px-2 py-1' : 'text-[10px] px-1.5 py-0.5'} font-semibold rounded backdrop-blur-sm`}>
                <Clock className={isGiant ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
                {formatDuration(video.duration)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Direct Favorite Star Button */}
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

        {/* Center Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
          <div className={`${isGiant ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform`}>
            {isLocal ? (
              <Play className={`${isGiant ? 'w-8 h-8' : 'w-6 h-6'} fill-current ml-0.5`} />
            ) : (
              <ExternalLink className={isGiant ? 'w-7 h-7' : 'w-5 h-5'} />
            )}
          </div>
        </div>
      </div>

      {/* Info & Title Area */}
      <div className={`${isGiant ? 'p-4 sm:p-5' : 'p-3 sm:p-3.5'} flex-1 flex flex-col justify-between relative`}>
        {isEditing ? (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-2.5 py-1 rounded-lg border border-indigo-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded-lg transition"
            >
              Save
            </button>
          </div>
        ) : (
          <div>
            <h3 className={`${isGiant ? 'text-base sm:text-lg font-black' : 'text-xs sm:text-sm font-bold'} text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug`}>
              {video.title || 'Untitled Video'}
            </h3>
            {video.description && isGiant && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {video.description}
              </p>
            )}
          </div>
        )}

        {/* Card Footer Actions (with 3-dots menu) */}
        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs">
          <span className="text-[11px] text-slate-500">
            {isLocal ? 'Tap to play' : 'Tap to open'}
          </span>

          {/* 3-Dots Menu Container */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              title="Options"
              className="p-2 -mr-1 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-95"
            >
              <MoreVertical className="w-4 h-4 text-slate-300" />
            </button>

            {/* 3-Dots Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 bottom-8 z-30 w-52 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-1.5 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                {/* Share Video via WhatsApp, Messages, Instagram */}
                <button
                  onClick={handleShareVideo}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-700/80 font-medium transition text-left text-emerald-400"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Share Video (WhatsApp, SMS...)</span>
                </button>

                <button
                  onClick={() => {
                    handleStarClick({ stopPropagation: () => {} });
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-700/80 font-medium transition text-left"
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                  <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                </button>

                <button
                  onClick={() => {
                    setTempTitle(video.title || '');
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-700/80 font-medium transition text-left"
                >
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Rename Video</span>
                </button>

                {!isLocal && video.url && (
                  <button
                    onClick={() => {
                      window.open(video.url, '_blank', 'noopener,noreferrer');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-700/80 font-medium transition text-left"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span>Open Original Link</span>
                  </button>
                )}

                <div className="my-1 border-t border-slate-700" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(video.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-red-900/40 text-red-400 font-medium transition text-left"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Delete Video</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
