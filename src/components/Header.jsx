import React, { useRef, useState } from 'react';
import { 
  Plus, 
  Upload, 
  Search, 
  Film, 
  Smartphone, 
  Instagram, 
  Facebook, 
  Youtube,
  Globe,
  Star,
  Mic,
  MicOff,
  ClipboardPaste,
  RotateCw,
  Eye,
  LayoutGrid,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

function TikTokIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.9-4.48V8.71a8.21 8.21 0 0 0 4.87 1.6V6.86a4.86 4.86 0 0 1-1-.17z"/>
    </svg>
  );
}

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  activeFilter, 
  setActiveFilter, 
  onAddFiles, 
  onOpenAddLink,
  onPasteClipboard,
  isProcessingFiles,
  stats,
  viewMode,
  setViewMode,
  selectedTag,
  setSelectedTag,
  onOpenBackup,
  isSelectionMode,
  setIsSelectionMode
}) {
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Hard refresh & cache clear handler for mobile & desktop
  const handleHardRefresh = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (err) {
      console.warn('Cache clear error:', err);
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 400);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddFiles(files);
    }
    e.target.value = '';
  };

  // Voice Search using Web Speech API
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported on this browser. Please use Chrome or Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const quickTags = [
    { id: 'all', label: '✨ All Videos', query: '' },
    { id: 'trending', label: '🔥 Trending', query: 'trend' },
    { id: 'tutorials', label: '💡 Tutorials', query: 'tutorial' },
    { id: 'reels', label: '🎵 Music & Reels', query: 'reel' },
    { id: 'comedy', label: '😂 Comedy', query: 'comedy' },
    { id: 'fitness', label: '🏃 Fitness', query: 'fitness' },
    { id: 'personal', label: '📁 Personal', query: 'personal' },
  ];

  const handleTagClick = (tag) => {
    if (selectedTag === tag.id) {
      setSelectedTag('all');
      setSearchQuery('');
    } else {
      setSelectedTag(tag.id);
      setSearchQuery(tag.query);
    }
  };

  const filters = [
    { id: 'all', label: 'All Videos', count: stats.total, icon: Film, starColor: false },
    { id: 'favorite', label: 'Favorites', count: stats.favorite, icon: Star, starColor: true },
    { id: 'gallery', label: 'My Device', count: stats.gallery, icon: Smartphone, starColor: false },
    { id: 'instagram', label: 'Instagram', count: stats.instagram, icon: Instagram, starColor: false },
    { id: 'tiktok', label: 'TikTok', count: stats.tiktok || 0, icon: TikTokIcon, starColor: false },
    { id: 'youtube', label: 'YouTube', count: stats.youtube, icon: Youtube, starColor: false },
    { id: 'facebook', label: 'Facebook', count: stats.facebook, icon: Facebook, starColor: false },
    { id: 'web', label: 'Web', count: stats.web, icon: Globe, starColor: false },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
        {/* Top bar: Brand & Top Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img 
              src="/napira_logo.png" 
              alt="Napira" 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30 shrink-0" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                    Napira
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Vault
                  </span>
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {stats.total === 0 ? 'Universal Video & Media Vault' : `${stats.total} saved videos & reels`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Multi-Select Toggle Button */}
            {stats.total > 0 && (
              <button
                onClick={() => setIsSelectionMode?.(prev => !prev)}
                title={isSelectionMode ? "Exit Select Mode" : "Select multiple videos to delete or favorite"}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isSelectionMode
                    ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md font-extrabold scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isSelectionMode ? 'Done' : 'Select'}</span>
              </button>
            )}

            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode?.(prev => prev === 'giant' ? 'normal' : 'giant')}
              title={viewMode === 'giant' ? "Switch to Normal Grid View" : "Switch to Large View"}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                viewMode === 'giant'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {viewMode === 'giant' ? <LayoutGrid className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden sm:inline">{viewMode === 'giant' ? 'Grid View' : 'Large View'}</span>
              <span className="sm:hidden">{viewMode === 'giant' ? 'Grid' : 'Large'}</span>
            </button>

            {/* Backup Modal Button */}
            <button
              onClick={onOpenBackup}
              title="Backup & Restore your video collection"
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            {/* Refresh App Button */}
            <button
              onClick={handleHardRefresh}
              disabled={isUpdating}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition shadow-sm"
              title="Reload and check for updates"
            >
              <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isUpdating ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {/* Desktop Action Buttons (hidden on mobile, shown on sm+) */}
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <button
                onClick={onPasteClipboard}
                title="Paste link from clipboard"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-bold px-3.5 py-2 rounded-xl shadow-md transition"
              >
                <ClipboardPaste className="w-4 h-4 text-emerald-100" />
                <span>Paste Link</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                title="Upload videos from phone or computer"
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md shadow-indigo-600/25 transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </button>

              <button
                onClick={onOpenAddLink}
                title="Add video URL manually"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-semibold px-3 py-2 rounded-xl border border-slate-700 transition"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons (Dedicated 3-column row) */}
        <div className="grid grid-cols-3 gap-2 mt-2 sm:hidden">
          <button
            onClick={onPasteClipboard}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold py-2.5 px-1 rounded-xl shadow-md transition"
          >
            <ClipboardPaste className="w-4 h-4 text-emerald-100 shrink-0" />
            <span className="truncate">Paste Link</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFiles}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 text-white text-xs font-bold py-2.5 px-1 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <span className="truncate">Upload</span>
          </button>

          <button
            onClick={onOpenAddLink}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold py-2.5 px-1 rounded-xl border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Add Link</span>
          </button>
        </div>

        {/* Hidden native mobile & desktop file input */}
        <input 
          ref={fileInputRef}
          type="file"
          accept="video/*,video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Search Bar with Voice Search */}
        <div className="mt-2.5 relative flex items-center">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search videos, creators, platforms, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-800 text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag?.('all');
                }}
                className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full hover:bg-slate-600"
              >
                ✕
              </button>
            )}

            {/* Microphone Voice Search Button */}
            <button
              onClick={handleVoiceSearch}
              title="Voice Search (Tap & Speak)"
              className={`p-2 rounded-lg transition ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/60'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Category Tag Chips */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
          {quickTags.map((tag) => {
            const isTagActive = (selectedTag === tag.id) || (!selectedTag && tag.id === 'all' && !searchQuery);
            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isTagActive
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm font-extrabold scale-105'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>

        {/* Filter Tabs (Horizontal scrolling) */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {filters.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? tab.starColor 
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.starColor && !isActive ? 'text-amber-400 fill-amber-400/20' : ''} ${isActive && tab.starColor ? 'fill-slate-950' : ''}`} />
                <span>{tab.label}</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive 
                    ? tab.starColor ? 'bg-amber-600/40 text-slate-950' : 'bg-indigo-700 text-indigo-100' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
