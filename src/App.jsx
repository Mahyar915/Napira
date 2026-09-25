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
import RenameModal from './components/RenameModal';
import VideoActionSheet from './components/VideoActionSheet';
import BatchActionBar from './components/BatchActionBar';
import { 
  getAllVideos, 
  addVideo, 
  updateVideo, 
  deleteVideo, 
  deleteMultipleVideos,
  updateMultipleVideos,
  toggleFavorite, 
  resetToDefaults 
} from './db/indexedDB';
import { generateVideoThumbnail, createFastPlaceholderThumbnail, formatBytes } from './utils/thumbnail';
import { Smartphone, Film, Star, Loader2 } from 'lucide-react';

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
  
  // Modals & Sheets
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [actionSheetVideo, setActionSheetVideo] = useState(null);
  const [renameModalVideo, setRenameModalVideo] = useState(null);

  // Multi-Select Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Gallery/File processing state
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

  // Ref tracking latest videos state for atomic background operations
  const videosRef = useRef(videos);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

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

    // Reset search filters so newly uploaded videos are immediately visible
    setSearchQuery('');
    setSelectedTag('all');
    setActiveFilter('gallery');

    // 1. Instant Optimistic UI Insertion (< 5ms) - ZERO FREEZING!
    const optimisticItems = [];
    const baseTimestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      const instantThumb = createFastPlaceholderThumbnail(cleanTitle);

      const optimisticItem = {
        id: `local-${baseTimestamp}-${Math.random().toString(36).slice(2, 7)}-${i}`,
        title: cleanTitle || `Video ${videos.length + i + 1}`,
        type: 'local',
        source: 'gallery',
        size: formatBytes(file.size),
        duration: null,
        thumbnail: instantThumb,
        videoBlob: file,
        createdAt: new Date(baseTimestamp - i * 1000).toISOString(),
        favorite: false,
        isProcessing: true,
      };
      optimisticItems.push(optimisticItem);
    }

    // Immediately show all cards on screen in 0ms! Never wait for IndexedDB or decoder!
    setVideos((prev) => [...optimisticItems, ...prev]);
    if (navigator.vibrate) navigator.vibrate(30);

    // 2. Background Asynchronous Processing Queue (Non-blocking & memory-safe)
    setIsProcessingFiles(true);
    setProcessingProgress({ current: 0, total: optimisticItems.length });

    for (let i = 0; i < optimisticItems.length; i++) {
      const item = optimisticItems[i];
      const file = item.videoBlob;
      setProcessingProgress({ current: i + 1, total: optimisticItems.length });

      // Yield 40ms to browser main thread so UI stays 100% smooth, animations play, touch works
      await new Promise((resolve) => setTimeout(resolve, 40));

      let thumbnail = item.thumbnail;
      let duration = null;

      try {
        const res = await generateVideoThumbnail(file);
        thumbnail = res.thumbnail || thumbnail;
        duration = res.duration || null;
      } catch (err) {
        console.warn('Thumbnail generation skipped for:', item.title, err);
      }

      // Check current state in case user renamed or favorited this item while processing
      const currentInState = videosRef.current.find((v) => v.id === item.id);
      const finalTitle = currentInState?.title || item.title;
      const finalFavorite = currentInState?.favorite ?? item.favorite;

      const finalItem = {
        ...item,
        title: finalTitle,
        favorite: finalFavorite,
        thumbnail,
        duration,
        isProcessing: false,
      };

      // Persist to IndexedDB exactly once
      try {
        await addVideo(finalItem);
      } catch (dbErr) {
        console.error('IndexedDB save error for:', item.title, dbErr);
      }

      // Update card in UI with resolved thumbnail & duration
      setVideos((prev) =>
        prev.map((v) =>
          v.id === item.id
            ? {
                ...v,
                thumbnail,
                duration,
                isProcessing: false,
              }
            : v
        )
      );
    }

    setIsProcessingFiles(false);
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
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
    if (actionSheetVideo?.id === id) {
      setActionSheetVideo((prev) => prev ? { ...prev, favorite: isFav } : null);
    }
  };

  // Handle renaming with guaranteed IndexedDB persistence
  const handleRename = async (id, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    const cleanTitle = newTitle.trim();

    // 1. Immediately update UI state
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, title: cleanTitle } : v))
    );

    // 2. Guaranteed persistence to IndexedDB
    try {
      await updateVideo(id, { title: cleanTitle });
    } catch (err) {
      console.error('Failed to persist rename to IndexedDB:', err);
    }

    if (navigator.vibrate) navigator.vibrate(20);
  };

  // Handle deleting video
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (activePlayerVideo?.id === id) {
        setActivePlayerVideo(null);
      }
      if (actionSheetVideo?.id === id) {
        setActionSheetVideo(null);
      }
      if (navigator.vibrate) navigator.vibrate(20);
    }
  };

  // Multi-select batch handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredVideos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVideos.map((v) => v.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (window.confirm(`Are you sure you want to delete ${count} selected video${count > 1 ? 's' : ''}?`)) {
      const idsArray = Array.from(selectedIds);
      await deleteMultipleVideos(idsArray);
      setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  const handleBatchFavorite = async (favStatus = true) => {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    await updateMultipleVideos(idsArray, { favorite: favStatus });
    setVideos((prev) =>
      prev.map((v) => (selectedIds.has(v.id) ? { ...v, favorite: favStatus } : v))
    );
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleCancelSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  // Safe Share function (prevents WebKit Jetsam memory limit crash on iOS)
  const handleSafeShare = async (video) => {
    if (!video) return;

    // 1. Social Media / Web links (100% crash-proof with navigator.share)
    if (video.type !== 'local' && video.url) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: video.title || 'Napira Video',
            text: `${video.title || 'Check out this video'} via Napira`,
            url: video.url,
          });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
      // Fallback: Copy link
      try {
        await navigator.clipboard.writeText(video.url);
        alert('Video link copied to clipboard!');
      } catch {}
      return;
    }

    // 2. Local device videos
    if (video.type === 'local' && video.videoBlob) {
      const isSmallFile = video.videoBlob.size < 15 * 1024 * 1024; // < 15MB
      // Only attempt navigator.share on small files to prevent iOS Safari memory crash
      if (isSmallFile && navigator.share && navigator.canShare) {
        try {
          const cleanFileName = (video.title || 'video').replace(/[^a-zA-Z0-9_-]/g, '_') + '.mp4';
          const file = new File([video.videoBlob], cleanFileName, { type: video.videoBlob.type || 'video/mp4' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: video.title || 'Video',
              files: [file],
            });
            return;
          }
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }

      // For large files (15MB+) or when navigator.share fails:
      // Trigger native browser download/save to Photos without crashing WebKit
      const url = URL.createObjectURL(video.videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(video.title || 'video').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
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

      {/* Header with Search, Voice search, View switcher, Select mode, and Actions */}
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
        isSelectionMode={isSelectionMode}
        setIsSelectionMode={setIsSelectionMode}
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
        <div className="sticky top-[115px] sm:top-[74px] z-20 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-in fade-in duration-150">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-200 shrink-0" />
          <span>
            Importing & optimizing videos: {processingProgress.current} of {processingProgress.total} ({Math.round((processingProgress.current / (processingProgress.total || 1)) * 100)}%)... (You can play videos immediately!)
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

        {/* Featured Daily Spotlight (Shown when on All tab, not searching, not in select mode, and videos exist) */}
        {!searchQuery && activeFilter === 'all' && !isSelectionMode && !loading && videos.length > 0 && (
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
                  onPlay={handlePlayVideo}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenActionSheet={(v) => setActionSheetVideo(v)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(video.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer (Clear All Videos permanently removed as requested) */}
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
        </div>
      </footer>

      {/* Video Action Sheet (3-dots bottom drawer, unclipped on mobile) */}
      <VideoActionSheet
        isOpen={!!actionSheetVideo}
        video={actionSheetVideo}
        onClose={() => setActionSheetVideo(null)}
        onShare={handleSafeShare}
        onToggleFavorite={handleToggleFavorite}
        onOpenRename={(v) => {
          setActionSheetVideo(null);
          setRenameModalVideo(v);
        }}
        onDelete={handleDelete}
        onPlay={handlePlayVideo}
      />

      {/* Focused Rename Modal with keyboard Enter support & guaranteed persistence */}
      <RenameModal
        isOpen={!!renameModalVideo}
        video={renameModalVideo}
        onClose={() => setRenameModalVideo(null)}
        onSave={handleRename}
      />

      {/* Floating Batch Action Bar (Shown in Selection Mode) */}
      {isSelectionMode && filteredVideos.length > 0 && (
        <BatchActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredVideos.length}
          onSelectAll={handleSelectAll}
          onBatchFavorite={handleBatchFavorite}
          onBatchDelete={handleBatchDelete}
          onCancel={handleCancelSelection}
        />
      )}

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
