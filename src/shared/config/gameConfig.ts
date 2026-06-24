export interface GameConfig {
  id: string;
  title: string;
  description: string;
  gradient: string;
  bannerGradient: string;
  modes: ("offline" | "online")[];
  offlinePath: string;
  onlinePath: string;
  comingSoon?: boolean;
}

export const GAMES_CONFIG: GameConfig[] = [
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe",
    description: "Classic grid alignment strategy game. Challenge the smart AI or a friend locally/online.",
    gradient: "from-violet-500 to-purple-600",
    bannerGradient: "from-violet-600/20 via-purple-600/10 to-transparent",
    modes: ["offline", "online"],
    offlinePath: "/play/tictactoe/offline",
    onlinePath: "/online?game=tictactoe",
  },
  {
    id: "ludo",
    title: "Ludo Arena",
    description: "Roll the dice, capture opponent tokens, and secure victory in the ultimate Ludo experience.",
    gradient: "from-amber-500 to-orange-600",
    bannerGradient: "from-amber-600/20 via-orange-600/10 to-transparent",
    modes: ["offline", "online"],
    offlinePath: "/play/ludo/offline",
    onlinePath: "/online?game=ludo",
  },
  {
    id: "wordbattle",
    title: "Word Battle",
    description: "Guess, Compete, Win. Challenge yourself in Solo, Hangman, or real-time Multiplayer word matches.",
    gradient: "from-emerald-400 to-teal-500",
    bannerGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    modes: ["offline", "online"],
    offlinePath: "/play/wordbattle",
    onlinePath: "/online?game=wordbattle",
  },
  {
    id: "snake",
    title: "Snake",
    description: "Navigate the grid, devour apples, and grow without colliding. A classic arcade experience. Coming soon.",
    gradient: "from-rose-500 to-pink-600",
    bannerGradient: "from-rose-600/20 via-pink-600/10 to-transparent",
    modes: ["offline", "online"],
    offlinePath: "#",
    onlinePath: "#",
    comingSoon: true,
  },
  {
    id: "memory",
    title: "Memory Match",
    description: "Test your memory skills by finding pairs of matching cards under the ticking clock. Coming soon.",
    gradient: "from-sky-500 to-indigo-600",
    bannerGradient: "from-sky-600/20 via-indigo-600/10 to-transparent",
    modes: ["offline", "online"],
    offlinePath: "#",
    onlinePath: "#",
    comingSoon: true,
  },
  {
    id: "rps",
    title: "Rock Paper Scissors",
    description: "Outsmart your opponent in this classic game of quick decisions and strategy. Coming soon.",
    gradient: "from-emerald-500 to-teal-600",
    bannerGradient: "from-emerald-600/20 via-teal-600/10 to-transparent",
    modes: ["offline", "online"],
    offlinePath: "#",
    onlinePath: "#",
    comingSoon: true,
  },
];
