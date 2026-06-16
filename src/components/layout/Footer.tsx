// ============================================================
// Footer Component
// ============================================================

import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto py-8 sm:py-10 text-center pb-[calc(1.5rem+env(safe-area-inset-bottom))] glass border-t border-border/40 shadow-xl">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <p className="font-semibold tracking-wider text-foreground">
          © 2026 Game Galaxy Hub. All Rights Reserved.
        </p>
        <p className="font-medium text-muted-foreground/80">
          Developed by <span className="text-primary font-bold tracking-wide transition-colors hover:text-primary/80">Qayoom</span>
        </p>
      </div>
    </footer>
  );
}
