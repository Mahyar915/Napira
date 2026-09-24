import React, { useEffect, useState, useRef } from 'react';
import { X, Download, Share2, Smartphone, Repeat, Tv, Play, Pause, FastForward } from 'lucide-react';
import { formatBytes, formatDuration } from '../utils/thumbnail';

export default function VideoPlayerModal({ video, onClose }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!video) return;

    let url = null;
    if (video.videoBlob) {
      url = URL.createObjectURL(video.videoBlob);
      setVideoSrc(url);
    } else if (video.url) {
      setVideoSrc(video.url);
    }

    // Reset player states
    setPlaybackSpeed(1);
    setIsLooping(false);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [video, onClose]);

  if (!video) return null;

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (videoRef.current) {
      videoRef.current.loop = nextLoop;
    }
  };

  const handlePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current && videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const handleDownload = () => {
    if (!videoSrc) return;
    const a = document.createElement('a');
    a.href = videoSrc;
    a.download = `${video.title || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share && video.videoBlob) {
      try {
        const file = new File([video.videoBlob], `${video.title || 'video'}.mp4`, { type: video.videoBlob.type || 'video/mp4' });
        await navigator.share({
          files: [file],
          title: video.title,
        });
      } catch (err) {
        console.log('Share canceled or error:', err);
      }
    }
  };

  const speedOptions = [
    { label: '0.25x', value: 0.25 },
    { label: '0.5x Slow', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1x Normal', value: 1.0 },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="text-base">🎬</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">
              {video.title || 'Playing Video'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pop-Out / TV Cast (PiP) */}
            <button
              onClick={handlePictureInPicture}
              title="Pop out video / Cast to TV screen"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-indigo-300 rounded-xl transition border border-slate-700"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pop Out / TV</span>
            </button>

            {navigator.share && video.videoBlob && (
              <button
                onClick={handleShare}
                title="Share"
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDownload}
              title="Download video"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative bg-black flex items-center justify-center aspect-video max-h-[65vh]">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              autoPlay
              playsInline
              loop={isLooping}
              x-webkit-airplay="allow"
              className="w-full h-full max-h-[65vh] object-contain"
            />
          ) : (
            <div className="p-12 text-slate-500 text-sm">Loading video file...</div>
          )}
        </div>

        {/* Training Toolbar: Slow-Motion Speeds & Loop Mode */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Speed Selectors */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Speed:</span>
            {speedOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => handleSpeedChange(s.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  playbackSpeed === s.value
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Loop Mode Toggle Button */}
          <button
            onClick={handleToggleLoop}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              isLooping
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
            }`}
          >
            <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'animate-spin' : ''}`} />
            <span>{isLooping ? 'Loop Video: ON' : 'Loop Video: OFF'}</span>
          </button>
        </div>

        {/* Video Info Footer */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{video.size || (video.videoBlob ? formatBytes(video.videoBlob.size) : '')}</span>
          <span>{video.duration ? `Duration: ${formatDuration(video.duration)}` : ''}</span>
        </div>
      </div>
    </div>
  );
}
