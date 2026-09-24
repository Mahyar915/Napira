import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './components/Header';
import VideoCard from './components/VideoCard';
import VideoPlayerModal from './components/VideoPlayerModal';
import AddLinkModal from './components/AddLinkModal';
import SpotlightCard from './components/SpotlightCard';
import WelcomeHero from './components/WelcomeHero';
import BackupModal from './components/BackupModal';
import InstallPrompt from './components/InstallPrompt';
import ClipboardBanner from './components/ClipboardBanner';
import { 
  getAllVideos, 
  addVideo, 
  updateVideo, 
  deleteVideo, 
  toggleFavorite, 
  resetToDefaults 
} from './db/indexedDB';
import { generateVideoThumbnail, formatBytes } from './utils/thumbnail';
import { Smartphone, Film, Star, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const fileInputHiddenRef = useRef(null);

  // View Mode ('normal' multi-grid vs 'giant' single-column comfortable view)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('napira_view_mode') || 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('napira_view_mode', viewMode);
    } catch {}
  }, [viewMode]);
  
  // Modals & States
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  
  // Gallery/File processing state
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  // Load from IndexedDB on startup (Clean slate: returns empty array if new)
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAllVideos();
        setVideos(data || []);
      } catch (err) {
        console.error('Failed to load videos from NapiraDB:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to import and scrape external link
  const handleAutoImportLink = useCallback(async (targetUrl) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    let source = 'web';
    const low = cleanUrl.toLowerCase();
    if (low.includes('instagram.com')) source = 'instagram';
    else if (low.includes('facebook.com')) source = 'facebook';
    else if (low.includes('youtube.com') || low.includes('youtu.be')) source = 'youtube';
    else if (low.includes('tiktok.com')) source = 'tiktok';

    let scrapedTitle = null;
    let scrapedThumbnail = null;
    let scrapedDesc = '';

    // Direct YouTube thumbnail extraction (immediate)
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      scrapedThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      scrapedTitle = 'YouTube Video';
    }

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(cleanUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title && data.title !== 'Video') scrapedTitle = data.title;
        if (data.thumbnail) scrapedThumbnail = data.thumbnail;
        if (data.description) scrapedDesc = data.description || '';
        if (data.source) source = data.source;
      }
    } catch (err) {
      console.warn('Scrape failed:', err);
    }

    const fallbackTitle = source === 'youtube' 
      ? 'YouTube Video' 
      : source === 'instagram' 
      ? 'Instagram Reel' 
      : source === 'tiktok'
      ? 'TikTok Video'
      : source === 'facebook'
      ? 'Facebook Video'
      : 'Saved Video';

    const newVideo = {
      id: `link-${Date.now()}`,
      url: cleanUrl,
      title: scrapedTitle || fallbackTitle,
      description: scrapedDesc,
      source,
      type: 'link',
      thumbnail: scrapedThumbnail,
      createdAt: new Date().toISOString(),
      favorite: false
    };

    await addVideo(newVideo);
    setVideos((prev) => [newVideo, ...prev]);
    setActiveFilter('all');
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  // Check clipboard for video URLs
  const checkClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const match = text.match(/(https?:\/\/[^\s]+)/);
        if (match && match[1]) {
          const url = match[1];
          const isVideoUrl = 
            url.includes('instagram.com') || 
            url.includes('tiktok.com') || 
            url.includes('youtube.com') || 
            url.includes('youtu.be') || 
            url.includes('facebook.com') ||
            url.endsWith('.mp4');

          if (isVideoUrl && !videos.some((v) => v.url === url)) {
            setCopiedUrl(url);
          }
        }
      }
    } catch {}
  }, [videos]);

  useEffect(() => {
    checkClipboard();
    window.addEventListener('focus', checkClipboard);
    return () => window.removeEventListener('focus', checkClipboard);
  }, [checkClipboard]);

  // Handle 1-Click Paste button from Header
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const match = text.match(/(https?:\/\/[^\s]+)/);
        if (match && match[1]) {
          await handleAutoImportLink(match[1]);
          setCopiedUrl(null);
        } else {
          setIsAddLinkOpen(true);
        }
      } else {
        setIsAddLinkOpen(true);
      }
    } catch {
      setIsAddLinkOpen(true);
    }
  };

  // Handle picking videos from device / phone gallery / computer
  const handleAddDeviceFiles = async (files) => {
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setProcessingProgress({ current: 0, total: files.length });

    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingProgress({ current: i + 1, total: files.length });

      try {
        const { thumbnail, duration } = await generateVideoThumbnail(file);
        const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

        const videoItem = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: cleanTitle || `Video ${videos.length + i + 1}`,
          type: 'local',
          source: 'gallery',
          size: formatBytes(file.size),
          duration,
          thumbnail,
          videoBlob: file,
          createdAt: new Date().toISOString(),
          favorite: false
        };

        await addVideo(videoItem);
        newItems.unshift(videoItem);
      } catch (err) {
        console.error('Error importing video file:', file.name, err);
      }
    }

    setVideos((prev) => [...newItems, ...prev]);
    setIsProcessingFiles(false);
    setActiveFilter('gallery');
    if (navigator.vibrate) navigator.vibrate(50);
  };

  // Handle adding external link manually from modal
  const handleAddLink = async (videoItem) => {
    await addVideo(videoItem);
    setVideos((prev) => [videoItem, ...prev]);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  // Handle toggle Favorite
  const handleToggleFavorite = async (id) => {
    const isFav = await toggleFavorite(id);
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, favorite: isFav } : v))
    );
  };

  // Handle updating video info (rename, thumbnail, etc.)
  const handleRename = async (id, newTitle, extraUpdates = {}) => {
    const updates = { title: newTitle, ...extraUpdates };
    await updateVideo(id, updates);
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  // Handle deleting video
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (activePlayerVideo?.id === id) {
        setActivePlayerVideo(null);
      }
      if (navigator.vibrate) navigator.vibrate(20);
    }
  };

  // Handle clear all videos
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all saved videos? This will empty your vault.')) {
      setLoading(true);
      await resetToDefaults();
      setVideos([]);
      setLoading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: videos.length,
      favorite: videos.filter((v) => !!v.favorite).length,
      gallery: videos.filter((v) => v.type === 'local' || v.source === 'gallery').length,
      instagram: videos.filter((v) => v.source === 'instagram' || v.url?.includes('instagram.com')).length,
      tiktok: videos.filter((v) => v.source === 'tiktok' || v.url?.includes('tiktok.com')).length,
      youtube: videos.filter((v) => v.source === 'youtube' || v.url?.includes('youtu')).length,
      facebook: videos.filter((v) => v.source === 'facebook' || v.url?.includes('facebook.com')).length,
      web: videos.filter((v) => {
        if (v.type === 'local' || v.source === 'gallery') return false;
        if (v.source === 'instagram' || v.url?.includes('instagram.com')) return false;
        if (v.source === 'tiktok' || v.url?.includes('tiktok.com')) return false;
        if (v.source === 'youtube' || v.url?.includes('youtu')) return false;
        if (v.source === 'facebook' || v.url?.includes('facebook.com')) return false;
        return true;
      }).length,
    };
  }, [videos]);

  // Filter & Search
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      // 1. Source / Favorite Filter
      if (activeFilter === 'favorite' && !v.favorite) return false;
      if (activeFilter === 'gallery' && v.type !== 'local' && v.source !== 'gallery') return false;
      if (activeFilter === 'instagram' && v.source !== 'instagram' && !v.url?.includes('instagram.com')) return false;
      if (activeFilter === 'tiktok' && v.source !== 'tiktok' && !v.url?.includes('tiktok.com')) return false;
      if (activeFilter === 'youtube' && v.source !== 'youtube' && !v.url?.includes('youtu')) return false;
      if (activeFilter === 'facebook' && v.source !== 'facebook' && !v.url?.includes('facebook.com')) return false;
      if (activeFilter === 'web') {
        const isLocal = v.type === 'local' || v.source === 'gallery';
        const isIg = v.source === 'instagram' || v.url?.includes('instagram.com');
        const isTt = v.source === 'tiktok' || v.url?.includes('tiktok.com');
        const isYt = v.source === 'youtube' || v.url?.includes('youtu');
        const isFb = v.source === 'facebook' || v.url?.includes('facebook.com');
        if (isLocal || isIg || isTt || isYt || isFb) return false;
      }

      // 2. Search Query
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const title = (v.title || '').toLowerCase();
      const desc = (v.description || '').toLowerCase();
      const url = (v.url || '').toLowerCase();

      return title.includes(query) || desc.includes(query) || url.includes(query);
    });
  }, [videos, activeFilter, searchQuery]);

  // Handle playing video
  const handlePlayVideo = (v) => {
    if (v.type === 'local' || v.source === 'gallery') {
      setActivePlayerVideo(v);
    } else if (v.url) {
      window.open(v.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle restoring backup
  const handleImportBackup = async (importedList) => {
    if (!importedList || importedList.length === 0) return;
    for (const item of importedList) {
      await addVideo(item);
    }
    const updated = await getAllVideos();
    setVideos(updated || []);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Hidden file input for WelcomeHero upload button */}
      <input 
        ref={fileInputHiddenRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleAddDeviceFiles(files);
          e.target.value = '';
        }}
      />

      {/* Header with Search, Voice search, View switcher, and Actions */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onAddFiles={handleAddDeviceFiles}
        onOpenAddLink={() => setIsAddLinkOpen(true)}
        onPasteClipboard={handlePasteClipboard}
        isProcessingFiles={isProcessingFiles}
        stats={stats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Clipboard Auto-Detect Banner */}
      <ClipboardBanner
        copiedUrl={copiedUrl}
        onAdd={async (url) => {
          setCopiedUrl(null);
          await handleAutoImportLink(url);
        }}
        onDismiss={() => setCopiedUrl(null)}
      />

      {/* Device Import Progress Banner */}
      {isProcessingFiles && (
        <div className="bg-indigo-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-inner">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            Processing & generating thumbnails: {processingProgress.current} of {processingProgress.total}...
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5">
        {/* Welcome Hero shown when vault is empty (perfect for marketing and first-time users) */}
        {!loading && videos.length === 0 && (
          <WelcomeHero 
            onPaste={handlePasteClipboard}
            onAddLink={() => setIsAddLinkOpen(true)}
            onUpload={() => fileInputHiddenRef.current?.click()}
          />
        )}

        {/* Featured Daily Spotlight (Shown when on All tab, not searching, and videos exist) */}
        {!searchQuery && activeFilter === 'all' && !loading && videos.length > 0 && (
          <SpotlightCard videos={videos} onPlay={handlePlayVideo} />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-9 h-9 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm font-semibold">Loading Napira vault...</p>
          </div>
        ) : filteredVideos.length === 0 && videos.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              {activeFilter === 'favorite' ? (
                <Star className="w-8 h-8 text-amber-400 fill-amber-400/30" />
              ) : activeFilter === 'gallery' ? (
                <Smartphone className="w-8 h-8 text-indigo-400" />
              ) : (
                <Film className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-200">
              No matching videos found
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1 mb-5">
              {searchQuery
                ? `No matching results for "${searchQuery}".`
                : activeFilter === 'favorite'
                ? 'Your favorites list is empty. Tap the star ⭐ on any video to add it here!'
                : activeFilter === 'gallery'
                ? 'Your device vault is empty. Tap "Upload Video" to add videos from your phone or computer!'
                : activeFilter === 'tiktok'
                ? 'Your TikTok vault is empty. Tap "Paste Link" to add TikTok videos!'
                : activeFilter === 'instagram'
                ? 'Your Instagram vault is empty. Tap "Paste Link" to add Instagram reels!'
                : activeFilter === 'youtube'
                ? 'Your YouTube vault is empty. Tap "Paste Link" or "+ Add Link" to add YouTube videos!'
                : activeFilter === 'facebook'
                ? 'Your Facebook vault is empty. Tap "Paste Link" to add Facebook videos!'
                : activeFilter === 'web'
                ? 'Your Web videos list is empty. Tap "Paste Link" or "+ Add Link" to add web videos!'
                : 'No videos currently in this category.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Grid of video cards */}
            <div className={
              viewMode === 'giant'
                ? "grid grid-cols-1 max-w-xl mx-auto gap-6 sm:gap-7"
                : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
            }>
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  viewMode={viewMode}
                  onPlay={(v) => setActivePlayerVideo(v)}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Napira</span>
          <span>•</span>
          <span>Universal Social & Device Video Vault</span>
          <span>•</span>
          <span className="text-cyan-400/80 font-medium">Offline-Ready PWA</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsBackupOpen(true)}
            className="hover:text-emerald-400 text-slate-400 font-semibold transition text-xs"
          >
            Backup & Restore
          </button>
          <span>•</span>
          <button 
            onClick={handleClearAll}
            className="hover:text-red-400 transition text-[11px]"
          >
            Clear all videos
          </button>
        </div>
      </footer>

      {/* Video Player Modal with Slow-Motion & Loop */}
      <VideoPlayerModal
        video={activePlayerVideo}
        onClose={() => setActivePlayerVideo(null)}
      />

      {/* Add External Link Modal */}
      <AddLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        onAdd={handleAddLink}
      />

      {/* Vault Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        videos={videos}
        onImport={handleImportBackup}
      />

      {/* Add to Home Screen Prompt for Mobile */}
      <InstallPrompt />
    </div>
  );
}
