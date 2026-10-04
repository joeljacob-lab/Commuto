import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

/**
 * Connects the socket and joins the student's personal private room.
 */
export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
  }
  if (userId) {
    socket.emit('join_user_room', userId);
  }
};

/**
 * Disconnects socket upon logout.
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};