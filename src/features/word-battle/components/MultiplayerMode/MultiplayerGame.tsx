"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { GameBoard } from "../SoloMode/GameBoard";
import { Keyboard } from "../Shared/Keyboard";
import { OpponentProgress } from "./OpponentProgress";
import { useWordBattleSocket } from "../../hooks/useWordBattleSocket";
import { useWordBattleStore } from "../../store/wordBattleStore";
import { isValidWord } from "../../lib/words/dictionary";
import { KeyboardState } from "../../types/word-battle";
import { cn } from "@/shared/services/utils";

const MAX_ATTEMPTS = 6;

interface MultiplayerGameProps {
  playerId: string;
  playerName: string;
}

function computeKeyboardStatuses(guesses: string[], secretWord: string): KeyboardState {
  const statuses: KeyboardState = {};
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l) => { statuses[l] = "unused"; });

  guesses.forEach((guess) => {
    guess.split("").forEach((char, i) => {
      if (char === secretWord[i]) {
        statuses[char] = "correct";
      } else if (secretWord.includes(char)) {
        if (statuses[char] !== "correct") statuses[char] = "present";
      } else {
        if (statuses[char] === "unused") statuses[char] = "absent";
      }
    });
  });
  return statuses;
}

export function MultiplayerGame({ playerId, playerName }: MultiplayerGameProps) {
  const room = useWordBattleStore((s) => s.multiplayerRoom);
  const { submitGuess, sendProgress } = useWordBattleSocket();

  const [localGuesses, setLocalGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const syncedRef = useRef(false);

  // Sync local state from room progress on mount / reconnect
  useEffect(() => {
    if (!room || syncedRef.current) return;
    const myProgress = room.playerProgress?.[playerId];
    if (myProgress && myProgress.guesses.length > 0) {
      setLocalGuesses(myProgress.guesses);
      const revealed = new Set(myProgress.guesses.map((_, i) => i));
      setRevealedRows(revealed);
    }
    syncedRef.current = true;
  }, [room, playerId]);

  const wordLength = (room?.secretWord?.length) || 5;
  // Server strips secretWord from broadcast — use placeholder for board rendering
  // The actual word is revealed only on room result. Use the player's own guesses for the board.
  const secretWord = room?.secretWord || "?????";
  const myProgress = room?.playerProgress?.[playerId];
  const isSolved = myProgress?.solved ?? false;
  const isFailed = myProgress?.failed ?? false;
  const isGameOver = room?.status === "finished";

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1800);
  }, []);

  const triggerShake = useCallback((row: number) => {
    setShakeRow(row);
    setTimeout(() => setShakeRow(null), 500);
  }, []);

  const handleChar = useCallback((char: string) => {
    if (isAnimating || isSolved || isFailed || isGameOver) return;
    if (currentGuess.length >= wordLength) return;
    setCurrentGuess((prev) => (prev + char).toUpperCase());
  }, [isAnimating, isSolved, isFailed, isGameOver, currentGuess.length, wordLength]);

  const handleDelete = useCallback(() => {
    if (isAnimating || isSolved || isFailed || isGameOver) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [isAnimating, isSolved, isFailed, isGameOver]);

  const handleEnter = useCallback(() => {
    if (isAnimating || isSolved || isFailed || isGameOver) return;
    if (currentGuess.length < wordLength) {
      showToast(`Word must be ${wordLength} letters`);
      triggerShake(localGuesses.length);
      return;
    }
    if (!isValidWord(currentGuess)) {
      showToast("Not in word list");
      triggerShake(localGuesses.length);
      return;
    }

    const newGuesses = [...localGuesses, currentGuess];
    setLocalGuesses(newGuesses);
    setCurrentGuess("");

    setIsAnimating(true);
    setTimeout(() => {
      setRevealedRows((prev) => new Set([...prev, newGuesses.length - 1]));
      setIsAnimating(false);
    }, wordLength * 100 + 500);

    // Send to server
    submitGuess(currentGuess);
    sendProgress(newGuesses.length);
  }, [isAnimating, isSolved, isFailed, isGameOver, currentGuess, wordLength, localGuesses, showToast, triggerShake, submitGuess, sendProgress]);

  const keyboardStatuses = computeKeyboardStatuses(localGuesses, secretWord);

  // Get opponent(s)
  const opponents = room?.players.filter((p) => p.playerId !== playerId) ?? [];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground/95 text-background text-sm font-bold shadow-2xl"
          >
            <AlertTriangle className="h-4 w-4" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress panels */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* My progress */}
        <OpponentProgress
          playerName={`${playerName} (You)`}
          attemptsUsed={localGuesses.length}
          solved={isSolved}
          failed={isFailed}
          isOpponent={false}
        />
        {/* Opponent progress */}
        {opponents.map((opp) => {
          const oppProgress = room?.playerProgress?.[opp.playerId];
          return (
            <OpponentProgress
              key={opp.playerId}
              playerName={opp.name}
              attemptsUsed={oppProgress?.attemptsUsed ?? 0}
              solved={oppProgress?.solved ?? false}
              failed={oppProgress?.failed ?? false}
              isOpponent={true}
            />
          );
        })}
      </div>

      {/* Game board */}
      <div
        className="w-full"
        style={{ maxWidth: `${Math.min(wordLength * 52 + (wordLength - 1) * 8, 380)}px` }}
      >
        <GameBoard
          secretWord={secretWord}
          guesses={localGuesses}
          currentGuess={currentGuess}
          shakeRow={shakeRow}
          revealedRows={revealedRows}
        />
      </div>

      {/* Status banners */}
      {isSolved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm"
        >
          ✓ You solved it! Waiting for opponent...
        </motion.div>
      )}
      {isFailed && !isSolved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 py-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-sm"
        >
          ✗ No more attempts — waiting for opponent...
        </motion.div>
      )}

      {/* Keyboard */}
      <div className="w-full max-w-lg">
        <Keyboard
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleEnter}
          statuses={keyboardStatuses}
        />
      </div>
    </div>
  );
}
