// ============================================================
// Navbar — Glassmorphic Navigation
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  BarChart3,
  Trophy,
  Menu,
  X,
  Settings,
  Globe,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/layout/SettingsModal";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Gamepad2 },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/online", label: "Multiplayer", icon: Globe },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

function NavbarContent() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Hide general site navigation navbar inside online gameplay rooms
  const isRoomPage = pathname.includes("/play/online/") || pathname.includes("/play/ludo/");
  if (isRoomPage) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
        <nav className="glass-strong max-w-6xl mt-2 sm:mt-3 mx-2 sm:mx-4 md:mx-6 lg:mx-auto rounded-2xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-background flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <img src="/logo.png" alt="GGH Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-sm sm:text-base font-black tracking-widest text-foreground uppercase select-none transition-colors group-hover:text-primary">
                Game Galaxy Hub
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;

                return (
                  <Link key={label} href={href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "relative gap-2 rounded-xl px-4 transition-all",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Keep settings and theme toggle directly visible on mobile header too */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-9 sm:w-9 rounded-full"
                onClick={() => setShowSettings(true)}
                aria-label="Open Settings"
              >
                <Settings className="h-4.5 w-4.5" />
              </Button>

              <ThemeToggle />

              {/* Mobile hamburger — min 44px touch target */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-9 sm:w-9 rounded-full md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                ) : (
                  <Menu className="h-5 w-5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Slide Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[300px] max-w-[85vw] bg-background/95 glass-strong border-l border-border/40 p-5 sm:p-6 flex flex-col justify-between shadow-2xl md:hidden pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wide text-muted-foreground uppercase">Menu</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {navLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;

                    return (
                      <Link key={label} href={href} onClick={() => setMobileOpen(false)}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full h-13 sm:h-12 justify-start gap-4 rounded-xl text-base sm:text-sm font-semibold transition-all px-4",
                            isActive
                              ? "text-primary bg-primary/10 border border-primary/20"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer with Quick Toggles */}
              <div className="space-y-4 pt-6 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Settings Panel</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileOpen(false);
                      setShowSettings(true);
                    }}
                    className="h-10 px-4 rounded-xl gap-2 text-xs font-bold transition-all border-border/60 hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Theme Mode</span>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
