"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const Icons = {
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  Share: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
  )
};

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // iOS detection
    const isIPad = navigator.userAgent.includes('iPad');
    const isIPhone = navigator.userAgent.includes('iPhone');
    const isIPod = navigator.userAgent.includes('iPod');
    const ios = (isIPad || isIPhone || isIPod) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // On iOS, we show the manual instruction prompt after a short delay
    if (ios && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/20">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2.5 rounded-xl">
            {isIOS ? <Icons.Share /> : <Icons.Download />}
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-sm leading-tight">Install TapBoost</p>
            <p className="text-[10px] opacity-90 leading-tight mt-1">
              {isIOS 
                ? "Tap 'Share' and then 'Add to Home Screen'" 
                : "Add to home screen for the full app experience."}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isIOS && deferredPrompt && (
            <Button size="sm" variant="secondary" onClick={handleInstall} className="font-bold text-xs h-8 px-4 rounded-lg shadow-sm">
              Install
            </Button>
          )}
          <button 
            onClick={() => setShowPrompt(false)} 
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <Icons.X />
          </button>
        </div>
      </div>
    </div>
  );
}