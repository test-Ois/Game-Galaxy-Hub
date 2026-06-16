// ============================================================
// ChatPanel Component — Real-time Room Chat System (Glassmorphic)
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, X, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/gameStore";
import { useOnlineSocket } from "@/hooks/useOnlineSocket";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_EMOJIS = ["😀", "🔥", "😂", "👍", "👎", "😮", "🎉", "☠️", "⚔️", "👑"];

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { sendChatMessage, sendTypingState } = useOnlineSocket();
  const chatHistory = useGameStore((s) => s.chatHistory);
  const typingPlayers = useGameStore((s) => s.typingPlayers);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlineRoom = useGameStore((s) => s.onlineRoom);

  const [inputVal, setInputVal] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen]);

  // Handle typing state broadcast
  const handleInputChange = (val: string) => {
    setInputVal(val);
    
    if (sendTypingState) {
      sendTypingState(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingState(false);
      }, 1500);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim() || !sendChatMessage) return;
    
    sendChatMessage(inputVal.trim());
    setInputVal("");
    setShowEmojis(false);
    
    if (sendTypingState) {
      sendTypingState(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
    setShowEmojis(false);
  };

  // Compile typing players list string
  const typingNames = Object.keys(typingPlayers)
    .filter((id) => id !== onlinePlayerId)
    .map((id) => {
      const p = onlineRoom?.players.find((player) => player.playerId === id);
      return p ? p.name : "Someone";
    });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />

          <motion.div
            initial={{ x: "100%", opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.9 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 w-full sm:w-[360px] md:w-[400px] z-50",
              "flex flex-col border-l border-border/40 bg-background/95 backdrop-blur-md shadow-2xl",
              "pb-[env(safe-area-inset-bottom)]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Room Chat</h3>
                  <p className="text-xs text-muted-foreground">Real-time room strategy</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-xl hover:bg-accent transition-all"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                  <MessageSquare className="h-8 w-8 stroke-1 text-muted-foreground/50" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                chatHistory.map((msg) => {
                  const isMe = msg.senderId === onlinePlayerId;
                  const isSystem = msg.type === "system";

                  if (isSystem) {
                    let badgeColor = "bg-primary/5 text-primary border-primary/10";
                    if (msg.systemType === "join") badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/15";
                    if (msg.systemType === "leave" || msg.systemType === "disconnect") badgeColor = "bg-red-500/10 text-red-400 border-red-500/15";
                    if (msg.systemType === "game_event") badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/15";

                    return (
                      <div key={msg.id} className="flex justify-center my-1 select-none">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5",
                          badgeColor
                        )}>
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <div className="flex items-center gap-1.5 mb-1 select-none">
                        <span className="text-xs font-bold text-muted-foreground">
                          {isMe ? "You" : msg.senderName}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed break-words whitespace-pre-wrap shadow-sm",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted border border-border/30 text-foreground rounded-tl-none"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Typing indicators */}
            {typingNames.length > 0 && (
              <div className="px-4 py-1.5 bg-background/50 border-t border-border/20 text-xs text-muted-foreground/80 flex items-center gap-1.5 select-none animate-pulse">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce delay-75" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce delay-225" />
                </div>
                <span>
                  {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing...
                </span>
              </div>
            )}

            {/* Quick Emojis Drawer */}
            {showEmojis && (
              <div className="p-2 border-t border-border/20 bg-muted/40 flex items-center justify-around flex-wrap gap-1 select-none">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="h-9 w-9 text-xl hover:scale-125 transition-transform flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Input */}
            <div className="p-3 border-t border-border/40 flex items-center gap-2 bg-background/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojis(!showEmojis)}
                className={cn(
                  "h-11 w-11 rounded-xl hover:bg-accent shrink-0 border border-border/30 transition-all",
                  showEmojis && "bg-accent border-primary/20 text-primary"
                )}
                aria-label="Toggle emoji picker"
              >
                <Smile className="h-5 w-5" />
              </Button>

              <input
                type="text"
                maxLength={100}
                placeholder="Type a message..."
                value={inputVal}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />

              <Button
                onClick={handleSend}
                disabled={!inputVal.trim()}
                className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0 shadow-md"
                aria-label="Send message"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
