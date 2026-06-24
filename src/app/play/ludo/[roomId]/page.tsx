// ============================================================
// Ludo Room Gameplay Page — Thin App Router Wrapper (Composition Root)
// ============================================================

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { LudoOnlineArena } from "@/features/ludo";
import { ChatPanel } from "@/features/chat";
import { useVoiceChat } from "@/features/voice";
import { useSettingsStore } from "@/features/settings";
import { useOnlineSocket } from "@/features/multiplayer";
import { useGameStore } from "@/store/gameStore";

export default function LudoRoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { socket, sendChatMessage, sendTypingState } = useOnlineSocket();
  const onlineRoom = useGameStore((s) => s.onlineRoom);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);

  // Instantiating Voice Chat at composition root to prevent feature-to-feature direct imports
  const {
    micActive,
    speakingPlayers,
    mutedPlayers,
    connectionStatuses,
    permissionDenied,
    toggleMic
  } = useVoiceChat({
    socket,
    roomId,
    playerId: onlinePlayerId || "",
    players: onlineRoom?.players || []
  });

  // Instantiating Settings store details at composition root
  const voiceSpeakerEnabled = useSettingsStore((s) => s.voiceSpeakerEnabled);
  const toggleVoiceSpeaker = useSettingsStore((s) => s.toggleVoiceSpeaker);

  return (
    <LudoOnlineArena
      roomId={roomId}
      micActive={micActive}
      speakingPlayers={speakingPlayers}
      mutedPlayers={mutedPlayers}
      connectionStatuses={connectionStatuses}
      permissionDenied={permissionDenied}
      onToggleMic={toggleMic}
      voiceSpeakerEnabled={voiceSpeakerEnabled}
      onToggleSpeaker={toggleVoiceSpeaker}
      chatPanel={
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onSendMessage={sendChatMessage}
          onSendTypingState={sendTypingState}
        />
      }
    />
  );
}
