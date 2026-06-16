// ============================================================
// PWA Install Prompt Component — Add to Home Screen Banner
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Intercept default browser prompt trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show prompt if user hasn't dismissed it in this session
      const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger standard browser install sheet
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation user outcome: ${outcome}`);

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-4 md:max-w-sm z-50 glass-strong p-3 sm:p-4 rounded-2xl border border-primary/20 shadow-2xl flex flex-col gap-2.5 sm:gap-3 mb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-foreground">Install App</h4>
              <p className="text-xs text-muted-foreground leading-normal">
                Add Game Galaxy Hub to your home screen for quick offline access and full-screen play.
              </p>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex gap-2 w-full">
          <Button
            onClick={handleInstallClick}
            className="flex-1 h-9 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 h-9 rounded-xl text-xs font-semibold border-border/50"
          >
            Later
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
