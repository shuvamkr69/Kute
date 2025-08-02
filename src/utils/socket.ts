import { io, Socket } from 'socket.io-client';

// Replace with your backend URL
const SOCKET_URL = 'http://10.1.83.13:3000'; // TODO: Set to your production backend if needed

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}; 