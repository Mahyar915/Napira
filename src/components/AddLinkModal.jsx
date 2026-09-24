import React, { useState } from 'react';
import { X, Link2, Instagram, Facebook, Globe, Youtube } from 'lucide-react';

export default function AddLinkModal({ isOpen, onClose, onAdd }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loadingScrape, setLoadingScrape] = useState(false);

  // Reset fields when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setTitle('');
      setError('');
      setLoadingScrape(false);
    }
  }, [isOpen]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const detectSource = (inputUrl) => {
    const low = inputUrl.toLowerCase();
    if (low.includes('instagram.com')) return 'instagram';
    if (low.includes('facebook.com')) return 'facebook';
    if (low.includes('youtube.com') || low.includes('youtu.be')) return 'youtube';
    if (low.includes('tiktok.com')) return 'tiktok';
    return 'web';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      new URL(cleanUrl);
    } catch {
      setError('Please enter a full URL (e.g. https://instagram.com/reel/...)');
      return;
    }

    const source = detectSource(cleanUrl);
    setLoadingScrape(true);

    let scrapedTitle = null;
    let scrapedThumbnail = null;
    let scrapedDesc = '';

    // Direct YouTube thumbnail handling
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      scrapedThumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      scrapedTitle = 'YouTube Video';
    }

    // Call API scrape for Instagram, Facebook, YouTube, etc.
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(cleanUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title && data.title !== 'Video') scrapedTitle = data.title;
        if (data.thumbnail) scrapedThumbnail = data.thumbnail;
        if (data.description) scrapedDesc = data.description;
      }
    } catch (err) {
      console.warn('Scrape warning:', err);
    }

    const fallbackTitle = source === 'youtube' 
      ? 'YouTube Video' 
      : source === 'instagram' 
      ? 'Instagram Reel' 
      : source === 'tiktok'
      ? 'TikTok Video'
      : source === 'facebook'
      ? 'Facebook Video'
      : `${source.toUpperCase()} Video`;

    onAdd({
      id: `link-${Date.now()}`,
      url: cleanUrl,
      title: title.trim() || scrapedTitle || fallbackTitle,
      description: scrapedDesc,
      source,
      type: 'link',
      thumbnail: scrapedThumbnail,
      createdAt: new Date().toISOString(),
      favorite: false
    });

    setLoadingScrape(false);
    setUrl('');
    setTitle('');
    setError('');
    onClose();
  };

  const detected = detectSource(url);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-400" />
            Add Video Link
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Video URL (Instagram, TikTok, YouTube, Facebook, Web...)
            </label>
            <input
              type="text"
              placeholder="https://www.instagram.com/reel/... or https://tiktok.com/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-800 text-slate-100 text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          {/* Detected Platform Tag */}
          {url && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Platform detected:</span>
              <span className="font-semibold capitalize text-indigo-300">
                {detected}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Favorite Reel, Tutorial, or Workout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 text-slate-100 text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingScrape}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {loadingScrape ? 'Fetching info...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
