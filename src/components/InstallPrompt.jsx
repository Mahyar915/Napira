import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed PWA)
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isInStandaloneMode()) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Android/Chrome beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || dismissed) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 sm:left-auto sm:right-4 sm:w-96 z-40 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-lg rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-100">
              Install Napira App
            </h4>
            <p className="text-[11px] text-slate-400">
              {isIOS
                ? 'Add to Home Screen for the full fullscreen app experience.'
                : 'Install as a standalone app on your phone or computer.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-indigo-300 flex items-center gap-1.5 font-medium">
          <span>Tap</span>
          <Share className="w-3.5 h-3.5 inline text-slate-200" />
          <span>Share in Safari, then select</span>
          <span className="underline decoration-indigo-400">Add to Home Screen</span>
          <PlusSquare className="w-3.5 h-3.5 inline text-slate-200" />
        </div>
      ) : deferredPrompt ? (
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleInstallClick}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold py-2 px-3 rounded-xl transition shadow-md"
          >
            Add to Home Screen (Install)
          </button>
        </div>
      ) : null}
    </div>
  );
}
