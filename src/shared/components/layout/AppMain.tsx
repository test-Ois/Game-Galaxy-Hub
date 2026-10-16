"use client";

import { usePathname } from "next/navigation";

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGameplay = pathname.startsWith("/play/");

  return (
    <main
      className={
        isGameplay
          ? "flex-1 relative z-10 pt-0"
          : "flex-1 relative z-10 pt-16 sm:pt-18 md:pt-20"
      }
    >
      {children}
    </main>
  );
}
