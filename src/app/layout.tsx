import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TicTacToe Arena — AI-Powered Tic-Tac-Toe",
  description:
    "A premium Tic-Tac-Toe experience featuring AI opponents with multiple difficulty levels, local multiplayer, series mode, and match history.",
  keywords: [
    "tic tac toe",
    "multiplayer game",
    "AI game",
    "strategy game",
    "web game",
  ],
  authors: [{ name: "Qayoom Akhtar" }],
  openGraph: {
    title: "TicTacToe Arena",
    description: "AI-Powered Tic-Tac-Toe Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="relative min-h-screen flex flex-col">
              {/* Background decorations */}
              <div className="fixed inset-0 grid-bg pointer-events-none" />
              <div className="orb orb-primary fixed w-[500px] h-[500px] -top-48 -right-48 opacity-60" />
              <div className="orb orb-accent fixed w-[400px] h-[400px] -bottom-32 -left-32 opacity-50" />

              <Navbar />
              <main className="flex-1 relative z-10 pt-20">
                {children}
              </main>
              <Footer />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
