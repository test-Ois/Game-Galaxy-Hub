// ============================================================
// TicTacToe Room Gameplay Page — Thin App Router Wrapper (Composition Root)
// ============================================================

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TicTacToeOnlineArena } from "@/features/tictactoe";
import { ChatPanel } from "@/features/chat";
import { useVoiceChat } from "@/features/voice";
import { useSettingsStore } from "@/features/settings";
import { useOnlineSocket } from "@/features/multiplayer";
import { useGameStore } from "@/store/gameStore";

export default function OnlinePlayPage() {
  const { roomId } = useParams() as { roomId: string };
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { socket, sendChatMessage, sendTypingState } = useOnlineSocket();
  const onlineRoom = useGameStore((s) => s.onlineRoom);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);

  // Instantiating Voice Chat at composition root to prevent feature-to-feature direct imports
  const {
    micActive,
    isSelfSpeaking,
    speakingPlayers,
    mutedPlayers,
    connectionStatuses,
    toggleMic,
    permissionDenied,
  } = useVoiceChat({
    socket,
    roomId,
    playerId: onlinePlayerId || "",
    players: onlineRoom?.players || [],
  });

  const opponent = onlineRoom?.players.find((p) => p.playerId !== onlinePlayerId);
  const isOpponentSpeaking = opponent ? (speakingPlayers[opponent.playerId] || false) : false;
  const isOpponentMuted = opponent ? (mutedPlayers[opponent.playerId] || false) : false;
  const connectionStatus = opponent ? (connectionStatuses[opponent.playerId] || "") : "";

  // Instantiating Settings store details at composition root
  const voiceSpeakerEnabled = useSettingsStore((s) => s.voiceSpeakerEnabled);
  const toggleVoiceSpeaker = useSettingsStore((s) => s.toggleVoiceSpeaker);

  return (
    <TicTacToeOnlineArena
      micActive={micActive}
      isSelfSpeaking={isSelfSpeaking}
      isOpponentSpeaking={isOpponentSpeaking}
      isOpponentMuted={isOpponentMuted}
      connectionStatus={connectionStatus}
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
