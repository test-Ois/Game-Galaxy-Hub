// ============================================================
// Footer Component
// ============================================================

import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 py-8 text-center">
      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
        Crafted with
        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" />
        by{" "}
        <span className="font-semibold text-foreground/80">
          Qayoom Akhtar
        </span>
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1.5">
        Built with Next.js · TypeScript · Tailwind CSS
      </p>
    </footer>
  );
}
