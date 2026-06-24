import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Navbar } from "@/shared/components/layout/Navbar";
import { Footer } from "@/shared/components/layout/Footer";
import { PWAInstallPrompt } from "@/shared/components/layout/PWAInstallPrompt";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Game Galaxy Hub — Play Multiple Games in One Place",
  description:
    "A premium multi-game platform featuring classic board games like Tic-Tac-Toe, Ludo Arena, and more. Play offline against smart AI or connect with players worldwide in real-time.",
  keywords: [
    "game galaxy hub",
    "board games",
    "tic tac toe",
    "ludo",
    "multiplayer game",
    "AI game",
    "strategy game",
    "web game",
  ],
  authors: [{ name: "Qayoom Akhtar" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Game Galaxy Hub",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Game Galaxy Hub",
    description: "Premium Real-Time Multiplayer Board Game Galaxy Hub",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Game Galaxy Hub",
    description: "Premium Real-Time Multiplayer Board Game Galaxy Hub",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="relative min-h-screen flex flex-col overflow-x-hidden">
              {/* Background decorations — responsive sizing */}
              <div className="fixed inset-0 grid-bg pointer-events-none" />
              <div className="orb orb-primary fixed w-[clamp(200px,50vw,500px)] h-[clamp(200px,50vw,500px)] -top-24 sm:-top-48 -right-24 sm:-right-48 opacity-60" />
              <div className="orb orb-accent fixed w-[clamp(160px,40vw,400px)] h-[clamp(160px,40vw,400px)] -bottom-16 sm:-bottom-32 -left-16 sm:-left-32 opacity-50" />

              <Navbar />
              <main className="flex-1 relative z-10 pt-16 sm:pt-18 md:pt-20">
                {children}
              </main>
              <Footer />
              <PWAInstallPrompt />
            </div>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(
                        function(reg) { console.log('SW registered:', reg.scope); },
                        function(err) { console.log('SW registration failed:', err); }
                      );
                    });
                  }
                `
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
