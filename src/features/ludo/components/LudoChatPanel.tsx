// ============================================================
// LudoChatPanel Component — Ludo Chat Trigger Wrapper
// ============================================================

"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface LudoChatPanelProps {
  unreadChatCount: number;
  onToggleChat: () => void;
  chatPanel?: React.ReactNode;
}

export function LudoChatPanel({ unreadChatCount, onToggleChat, chatPanel }: LudoChatPanelProps) {
  return (
    <>
      <Button
        onClick={onToggleChat}
        variant="outline"
        size="icon"
        className="w-10 h-10 rounded-xl border-border/50 hover:bg-accent transition-all shrink-0 relative"
        aria-label="Open chat panel"
      >
        <MessageSquare className="h-4.5 w-4.5 text-primary" />
        {unreadChatCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
            {unreadChatCount}
          </span>
        )}
      </Button>

      {chatPanel}
    </>
  );
}
