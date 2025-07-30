import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// // utils/socket.ts
// import { io, Socket } from "socket.io-client";
// import { ClientToServerEvents, ServerToClientEvents } from ".";

// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

// export const getSocket = () => {
//   if (!socket) {
//     socket = io(SOCKET_URL, {
//       withCredentials: true, // sends cookies
//     });
//   }
//   return socket;
// };
