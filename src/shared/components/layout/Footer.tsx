"use client";

// Site-wide footer: keep the global shell out of immersive gameplay rooms.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, GitBranch, Gamepad2, Trophy, Users, LayoutDashboard, Sparkles } from "lucide-react";

const exploreLinks = [
  { href: "/games", label: "Game library", icon: Gamepad2 },
  { href: "/online", label: "Multiplayer", icon: Users },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard", label: "Your dashboard", icon: LayoutDashboard },
];

const gameLinks = [
  { href: "/play/tictactoe/offline", label: "Tic-Tac-Toe" },
  { href: "/play/ludo/offline", label: "Ludo" },
  { href: "/play/wordbattle", label: "Word Battle" },
];

export function Footer() {
  const pathname = usePathname();

  // Gameplay is a focused, full-screen experience. Never render the global
  // footer beneath a board, room controls, chat drawer, or mobile viewport.
  if (pathname.startsWith("/play/")) return null;

  return (
    <footer className="relative z-10 mt-auto border-t border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pb-8 sm:pt-14 lg:px-8">
        {/* Brand and primary action */}
        <div className="mb-10 flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-foreground sm:text-base">
                Game Galaxy Hub
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Find your game. Challenge your people. Make every move count.
              </p>
            </div>
          </div>
          <Link
            href="/games"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Explore games <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Navigation columns */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-8">
          <div>
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
              Explore
            </h2>
            <ul className="space-y-3">
              {exploreLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex min-h-6 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-75 transition group-hover:opacity-100" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
              Quick play
            </h2>
            <ul className="space-y-3">
              {gameLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-6 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
              About the hub
            </h2>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              A growing home for quick solo matches, friendly competition, and real-time multiplayer game nights.
            </p>
            <a
              href="https://github.com/test-Ois/Game-Galaxy-Hub"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              Project on GitHub
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Legal / ownership strip */}
        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Game Galaxy Hub. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Built with <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> by
            <span className="font-bold text-foreground">Qayoom Akhtar</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
