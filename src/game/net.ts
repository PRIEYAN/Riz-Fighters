import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
export function getSocket(): Socket {
  if (socket) return socket;
  const url = (import.meta as any).env?.VITE_SOCKET_URL || "http://localhost:3001";
  socket = io(url, { transports: ["websocket"], autoConnect: true });
  return socket;
}

// Tiny shared room/match state the scenes read from.
export const matchState: {
  roomId: string;
  slot: 1 | 2;
  myName: string;
  oppName: string;
  myChar: string | null;
  oppChar: string | null;
  stage: number;
  round: number;
  wins: [number, number];
} = {
  roomId: "", slot: 1, myName: "", oppName: "???",
  myChar: null, oppChar: null, stage: 1, round: 1, wins: [0, 0],
};