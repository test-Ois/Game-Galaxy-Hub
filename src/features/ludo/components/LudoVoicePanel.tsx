// ============================================================
// LudoVoicePanel Component — Ludo Voice controls & alerts
// ============================================================

"use client";

import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/services/utils";

interface LudoVoicePanelProps {
  micActive: boolean;
  voiceSpeakerEnabled: boolean;
  permissionDenied: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  isCompact?: boolean;
}

export function LudoVoicePanel({
  micActive,
  voiceSpeakerEnabled,
  permissionDenied,
  onToggleMic,
  onToggleSpeaker,
  isCompact = false,
}: LudoVoicePanelProps) {
  const sizeClass = isCompact ? "w-9 h-9 sm:w-10 sm:h-10 rounded-xl" : "flex-1 h-11 rounded-xl";
  const iconSize = "h-4.5 w-4.5";

  return (
    <div className={cn("flex gap-2", !isCompact && "w-full")}>
      {/* Microphone toggle */}
      <Button
        onClick={onToggleMic}
        variant="outline"
        className={cn(
          "font-bold text-xs flex items-center justify-center gap-1.5 border border-border/50 transition-all",
          micActive
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
            : "hover:bg-accent text-muted-foreground",
          sizeClass
        )}
        aria-label={micActive ? "Mute Microphone" : "Unmute Microphone"}
      >
        {micActive ? <Mic className={iconSize} /> : <MicOff className={iconSize} />}
        {!isCompact && <span>{micActive ? "Mic" : "Muted"}</span>}
      </Button>

      {/* Speaker toggle */}
      <Button
        onClick={onToggleSpeaker}
        variant="outline"
        className={cn(
          "font-bold text-xs flex items-center justify-center gap-1.5 border border-border/50 transition-all",
          voiceSpeakerEnabled
            ? "bg-sky-500/10 text-sky-500 border-sky-500/30 hover:bg-sky-500/20"
            : "hover:bg-accent text-muted-foreground",
          sizeClass
        )}
        aria-label={voiceSpeakerEnabled ? "Mute Speaker" : "Unmute Speaker"}
      >
        {voiceSpeakerEnabled ? <Volume2 className={iconSize} /> : <VolumeX className={iconSize} />}
        {!isCompact && <span>{voiceSpeakerEnabled ? "Speaker" : "Muted"}</span>}
      </Button>

      {permissionDenied && !isCompact && (
        <div className="w-full text-red-500 text-[10px] font-bold text-center mt-1">
          ⚠️ Mic access blocked
        </div>
      )}
    </div>
  );
}
