'use client';
import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
export const getSocket = () => {
  if (!socket) socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', { autoConnect: false, withCredentials: true });
  return socket;
};
export const disconnectSocket = () => { socket?.disconnect(); socket = null; };
