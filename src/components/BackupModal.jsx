import React, { useState, useRef } from 'react';
import { X, Download, Upload, ShieldCheck, Share2, AlertCircle } from 'lucide-react';

export default function BackupModal({ isOpen, onClose, videos, onImport }) {
  const fileInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Export videos to JSON file & optional WhatsApp/Share
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backupData = {
        app: "Napira",
        version: "1.0",
        exportDate: new Date().toISOString(),
        totalVideos: videos.length,
        // Export video metadata & web links (fully transferable)
        videos: videos.map(v => ({
          id: v.id,
          title: v.title,
          url: v.url || '',
          source: v.source,
          type: v.type,
          description: v.description || '',
          thumbnail: v.thumbnail || '',
          favorite: !!v.favorite,
          duration: v.duration || null,
          createdAt: v.createdAt || new Date().toISOString()
        }))
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `napira_backup_${dateStr}.json`;

      // If mobile supports sharing files directly
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Napira - Video Vault Backup',
              text: `Backup of ${videos.length} videos from Napira app.`,
              files: [file]
            });
            setIsExporting(false);
            return;
          } catch (e) {
            // Fallback to standard download if user cancelled or error
          }
        }
      }

      // Standard browser download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setImportStatus('Backup downloaded successfully!');
    } catch (err) {
      console.error('Export error:', err);
      setImportStatus('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON backup file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedVideos = Array.isArray(parsed) ? parsed : (parsed.videos || []);
        if (!importedVideos || importedVideos.length === 0) {
          setImportStatus('No valid videos found in backup file.');
          return;
        }

        await onImport(importedVideos);
        setImportStatus(`Successfully imported ${importedVideos.length} videos!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err) {
        console.error('Import parse error:', err);
        setImportStatus('Invalid backup file. Please select a valid .json file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Vault Backup & Restore
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Keep your personal video library safe! Export your collection to a single backup file or share via WhatsApp/Messages, so you never lose your saved videos when switching devices.
          </p>

          {/* Export Option */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                Export Vault Backup
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Saves all {videos.length} videos to a single backup file
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition shrink-0"
            >
              {isExporting ? 'Saving...' : 'Backup Now'}
            </button>
          </div>

          {/* Import Option */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-400" />
                Restore from Backup
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Load videos from a previously exported backup
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition shrink-0"
            >
              Import
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Status Message */}
          {importStatus && (
            <div className="p-2.5 bg-slate-800 rounded-xl text-xs text-center font-semibold text-amber-300 border border-amber-500/20">
              {importStatus}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
