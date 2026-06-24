import { io, Socket } from "socket.io-client";
import { SOCKET_CONSTANTS } from "./socketConstants";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    socketInstance = io(socketUrl, {
      autoConnect: SOCKET_CONSTANTS.AUTO_CONNECT,
      reconnection: true,
      reconnectionAttempts: SOCKET_CONSTANTS.RECONNECTION_ATTEMPTS,
      reconnectionDelay: SOCKET_CONSTANTS.RECONNECTION_DELAY,
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
