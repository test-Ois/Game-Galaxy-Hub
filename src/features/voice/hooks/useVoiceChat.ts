// ============================================================
// useVoiceChat Hook — Mesh WebRTC Room Voice Chat (Multi-Peer)
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { useSettingsStore } from "@/features/settings";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface UseVoiceChatProps {
  socket: Socket | null;
  roomId: string;
  playerId: string;
  players: { playerId: string; isConnected: boolean; name: string; symbol: string }[];
}

interface VoiceSignal {
  type: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export function useVoiceChat({ socket, roomId, playerId, players }: UseVoiceChatProps) {
  const voiceMicEnabled = useSettingsStore((s) => s.voiceMicEnabled);
  const voiceSpeakerEnabled = useSettingsStore((s) => s.voiceSpeakerEnabled);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isSelfSpeaking, setIsSelfSpeaking] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState<Record<string, boolean>>({});
  const [mutedPlayers, setMutedPlayers] = useState<Record<string, boolean>>({});
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [permissionDenied, setPermissionDenied] = useState(false);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const candidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const initiateCallRef = useRef<((peerId: string) => Promise<void>) | null>(null);

  // Audio analysis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const localAnalysisIntervalRef = useRef<number | null>(null);
  const remoteAnalysisIntervalsRef = useRef<Map<string, number>>(new Map());

  // Helper to ensure AudioContext is initialized
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    return audioCtxRef.current;
  }, []);

  // Initialize Local Media Stream
  const initLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      console.log("[Voice] Acquiring local microphone stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = voiceMicEnabled;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setPermissionDenied(false);
      return stream;
    } catch (err) {
      console.error("[Voice] Failed to acquire microphone access:", err);
      setPermissionDenied(true);
      return null;
    }
  }, [voiceMicEnabled]);

  // Set up local audio analysis
  const startLocalAudioAnalysis = useCallback((stream: MediaStream) => {
    if (typeof window === "undefined") return;
    try {
      if (localAnalysisIntervalRef.current) {
        clearInterval(localAnalysisIntervalRef.current);
      }

      const audioCtx = getAudioContext();
      if (!audioCtx) return;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      localAnalyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!localAnalyserRef.current || !stream.getAudioTracks()[0]?.enabled) {
          setIsSelfSpeaking(false);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speaking = average > 12; // volume threshold

        setIsSelfSpeaking((prev) => {
          if (prev !== speaking && socket) {
            socket.emit("voiceStateUpdate", { roomId, micActive: stream.getAudioTracks()[0].enabled, speaking });
          }
          return speaking;
        });
      };

      const interval = setInterval(checkVolume, 150);
      localAnalysisIntervalRef.current = interval as unknown as number;
    } catch (e) {
      console.warn("[Voice] Failed local analysis setup:", e);
    }
  }, [roomId, socket, getAudioContext]);

  // Set up remote audio analyser
  const startRemoteAudioAnalysis = useCallback((peerId: string, stream: MediaStream) => {
    if (typeof window === "undefined") return;
    try {
      // Clear existing interval
      const oldInterval = remoteAnalysisIntervalsRef.current.get(peerId);
      if (oldInterval) {
        clearInterval(oldInterval);
      }

      const audioCtx = getAudioContext();
      if (!audioCtx) return;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      remoteAnalysersRef.current.set(peerId, analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        const currentAnalyser = remoteAnalysersRef.current.get(peerId);
        if (!currentAnalyser) {
          setSpeakingPlayers((prev) => ({ ...prev, [peerId]: false }));
          return;
        }

        currentAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speaking = average > 12;

        setSpeakingPlayers((prev) => {
          if (prev[peerId] !== speaking) {
            return { ...prev, [peerId]: speaking };
          }
          return prev;
        });
      };

      const interval = setInterval(checkVolume, 150);
      remoteAnalysisIntervalsRef.current.set(peerId, interval as unknown as number);
    } catch (e) {
      console.warn(`[Voice] Failed remote analysis setup for ${peerId}:`, e);
    }
  }, [getAudioContext]);

  // Play remote stream via background Audio node
  const playRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    if (typeof window === "undefined") return;
    try {
      let audio = remoteAudiosRef.current.get(peerId);
      if (audio) {
        audio.pause();
        audio.srcObject = null;
      } else {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudiosRef.current.set(peerId, audio);
      }

      audio.srcObject = stream;
      audio.muted = !voiceSpeakerEnabled;
      audio.play().catch((e) => {
        console.warn("[Voice] Auto play failed, user interaction needed:", e);
      });
      
      startRemoteAudioAnalysis(peerId, stream);
    } catch (e) {
      console.error(`[Voice] Error playing remote stream for ${peerId}:`, e);
    }
  }, [voiceSpeakerEnabled, startRemoteAudioAnalysis]);

  // Clean up a specific peer connection
  const cleanupPeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      try {
        pc.close();
      } catch { /* ignore */ }
      pcsRef.current.delete(peerId);
    }

    const audio = remoteAudiosRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      remoteAudiosRef.current.delete(peerId);
    }

    const interval = remoteAnalysisIntervalsRef.current.get(peerId);
    if (interval) {
      clearInterval(interval);
      remoteAnalysisIntervalsRef.current.delete(peerId);
    }

    remoteAnalysersRef.current.delete(peerId);
    candidateQueuesRef.current.delete(peerId);

    setConnectionStatuses((prev) => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });

    setSpeakingPlayers((prev) => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });

    setMutedPlayers((prev) => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });
  }, []);

  // Flush candidate queue
  const flushCandidates = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    const queue = candidateQueuesRef.current.get(peerId);
    if (pc && pc.remoteDescription && queue && queue.length > 0) {
      console.log(`[Voice] Flushing ${queue.length} candidates for ${peerId}`);
      queue.forEach(async (cand) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.error(`[Voice] Error adding queued ICE candidate for ${peerId}:`, e);
        }
      });
      candidateQueuesRef.current.set(peerId, []);
    }
  }, []);

  // Create Peer Connection for a specific player
  const createPeerConnection = useCallback(async (peerId: string, localStreamInstance: MediaStream) => {
    if (pcsRef.current.has(peerId)) {
      cleanupPeer(peerId);
    }

    console.log(`[Voice] Creating RTCPeerConnection for peer ${peerId}`);
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current.set(peerId, pc);
    candidateQueuesRef.current.set(peerId, []);

    // Add local tracks
    localStreamInstance.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamInstance);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("voiceSignal", {
          roomId,
          targetPlayerId: peerId,
          signal: { type: "candidate", candidate: event.candidate },
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[Voice] Connection to ${peerId} changed: ${state}`);
      setConnectionStatuses((prev) => ({ ...prev, [peerId]: state }));

      // Recalculate global voice connected state
      const hasAnyConnected = Array.from(pcsRef.current.values()).some(
        (c) => c.connectionState === "connected"
      );
      setIsVoiceConnected(hasAnyConnected);

      if (state === "failed" || state === "disconnected") {
        console.log(`[Voice] Connection failed/disconnected with ${peerId}. Triggering recovery...`);
        setTimeout(() => {
          const freshPC = pcsRef.current.get(peerId);
          if (freshPC && (freshPC.connectionState === "failed" || freshPC.connectionState === "disconnected")) {
            if (playerId < peerId) {
              console.log(`[Voice] Re-initiating call to ${peerId} for recovery`);
              initiateCallRef.current?.(peerId);
            }
          }
        }, 3000);
      }
    };

    // Tracks received
    pc.ontrack = (event) => {
      console.log(`[Voice] Received remote audio track from ${peerId}`);
      const stream = event.streams[0];
      playRemoteStream(peerId, stream);
    };

    return pc;
  }, [roomId, socket, cleanupPeer, playRemoteStream, playerId]);

  // Initiate call with a peer (we are the initiator)
  const initiateCall = useCallback(async (peerId: string) => {
    try {
      setConnectionStatuses((prev) => ({ ...prev, [peerId]: "connecting" }));
      const stream = await initLocalStream();
      if (!stream) return;

      startLocalAudioAnalysis(stream);
      const pc = await createPeerConnection(peerId, stream);

      console.log(`[Voice] Creating WebRTC Offer for ${peerId}`);
      const offer = await pc.createOffer();
      if (pc.signalingState === "stable") {
        await pc.setLocalDescription(offer);
        socket?.emit("voiceSignal", {
          roomId,
          targetPlayerId: peerId,
          signal: { type: "offer", offer },
        });
      }
    } catch (err) {
      console.error(`[Voice] Failed to initiate call to ${peerId}:`, err);
    }
  }, [initLocalStream, createPeerConnection, startLocalAudioAnalysis, roomId, socket]);

  // Sync ref to prevent stale closures and circular deps
  useEffect(() => {
    initiateCallRef.current = initiateCall;
  }, [initiateCall]);

  // Handle incoming signals
  const handleIncomingSignal = useCallback(async (senderPlayerId: string, signal: VoiceSignal) => {
    try {
      if (signal.type === "offer") {
        console.log(`[Voice] Received WebRTC offer from ${senderPlayerId}`);
        if (!signal.offer) return;
        const stream = await initLocalStream();
        if (!stream) return;

        startLocalAudioAnalysis(stream);
        const pc = await createPeerConnection(senderPlayerId, stream);

        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        flushCandidates(senderPlayerId);

        if (pc.signalingState === "have-remote-offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket?.emit("voiceSignal", {
            roomId,
            targetPlayerId: senderPlayerId,
            signal: { type: "answer", answer },
          });
        }
      } else if (signal.type === "answer") {
        console.log(`[Voice] Received WebRTC answer from ${senderPlayerId}`);
        if (!signal.answer) return;
        const pc = pcsRef.current.get(senderPlayerId);
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          flushCandidates(senderPlayerId);
        }
      } else if (signal.type === "candidate") {
        if (!signal.candidate) return;
        const pc = pcsRef.current.get(senderPlayerId);
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          const queue = candidateQueuesRef.current.get(senderPlayerId) || [];
          queue.push(signal.candidate);
          candidateQueuesRef.current.set(senderPlayerId, queue);
        }
      }
    } catch (e) {
      console.error(`[Voice] Error handling signal from ${senderPlayerId}:`, e);
    }
  }, [initLocalStream, createPeerConnection, startLocalAudioAnalysis, flushCandidates, roomId, socket]);

  // Toggle local mic
  const toggleMic = useCallback(() => {
    const nextState = !voiceMicEnabled;
    useSettingsStore.getState().setVoiceMicEnabled(nextState);
  }, [voiceMicEnabled]);

  // Sync mic toggle to tracks & broadcast state
  useEffect(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = voiceMicEnabled;
      }
    }
    if (socket) {
      socket.emit("voiceStateUpdate", {
        roomId,
        micActive: voiceMicEnabled,
        speaking: isSelfSpeaking,
      });
    }
  }, [voiceMicEnabled, isSelfSpeaking, roomId, socket]);

  // Sync speaker toggle to HTMLAudioElements
  useEffect(() => {
    remoteAudiosRef.current.forEach((audio) => {
      audio.muted = !voiceSpeakerEnabled;
    });
  }, [voiceSpeakerEnabled]);

  // Establish mesh connections as players join/rejoin/disconnect
  useEffect(() => {
    if (!socket || !playerId) return;

    // Scan players list
    players.forEach((p) => {
      if (p.playerId === playerId) return; // skip ourselves

      if (p.isConnected) {
        // We need an active peer connection with them
        if (!pcsRef.current.has(p.playerId)) {
          // Rule: lexicographically smaller playerId initiates to avoid race condition
          if (playerId < p.playerId) {
            console.log(`[Voice] Initiating voice connection: ${playerId} -> ${p.playerId}`);
            initiateCall(p.playerId);
          } else {
            console.log(`[Voice] Waiting for voice connection from: ${p.playerId}`);
          }
        }
      } else {
        // Opponent is disconnected, clean up their peer connection
        if (pcsRef.current.has(p.playerId)) {
          console.log(`[Voice] Cleaning up peer connection for disconnected player ${p.playerId}`);
          cleanupPeer(p.playerId);
        }
      }
    });

    // Cleanup players who left the room
    const currentRoomPlayerIds = players.map((p) => p.playerId);
    pcsRef.current.forEach((_, pId) => {
      if (!currentRoomPlayerIds.includes(pId)) {
        console.log(`[Voice] Player ${pId} left room, cleaning up peer connection`);
        cleanupPeer(pId);
      }
    });
  }, [players, playerId, socket, initiateCall, cleanupPeer]);

  // Listen to socket voice signaling events
  useEffect(() => {
    if (!socket) return;

    const onVoiceSignal = ({ senderPlayerId, signal }: { senderPlayerId: string; signal: VoiceSignal }) => {
      if (senderPlayerId === playerId) return;
      handleIncomingSignal(senderPlayerId, signal);
    };

    const onVoiceStateUpdate = ({
      playerId: senderPlayerId,
      micActive: opponentMic,
      speaking: opponentSpeaking,
    }: {
      playerId: string;
      micActive: boolean;
      speaking: boolean;
    }) => {
      if (senderPlayerId === playerId) return;
      setMutedPlayers((prev) => ({ ...prev, [senderPlayerId]: !opponentMic }));
      setSpeakingPlayers((prev) => ({ ...prev, [senderPlayerId]: opponentMic && opponentSpeaking }));
    };

    socket.on("voiceSignal", onVoiceSignal);
    socket.on("voiceStateUpdate", onVoiceStateUpdate);

    return () => {
      socket.off("voiceSignal", onVoiceSignal);
      socket.off("voiceStateUpdate", onVoiceStateUpdate);
    };
  }, [socket, playerId, handleIncomingSignal]);

  // Cleanup on unmount
  const cleanupVoice = useCallback(() => {
    console.log("[Voice] Cleaning up all voice hook properties...");

    if (localAnalysisIntervalRef.current) {
      clearInterval(localAnalysisIntervalRef.current);
      localAnalysisIntervalRef.current = null;
    }

    remoteAnalysisIntervalsRef.current.forEach((interval) => {
      clearInterval(interval);
    });
    remoteAnalysisIntervalsRef.current.clear();

    pcsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    pcsRef.current.clear();

    remoteAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudiosRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    setLocalStream(null);
    setIsVoiceConnected(false);
    setIsSelfSpeaking(false);
    setSpeakingPlayers({});
    setMutedPlayers({});
    setConnectionStatuses({});
    candidateQueuesRef.current.clear();
    remoteAnalysersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      cleanupVoice();
    };
  }, [cleanupVoice]);

  return {
    localStream,
    micActive: voiceMicEnabled,
    isVoiceConnected,
    isSelfSpeaking,
    speakingPlayers,
    mutedPlayers,
    connectionStatuses,
    permissionDenied,
    toggleMic,
    cleanupVoice,
  };
}
