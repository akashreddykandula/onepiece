import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://onepiece-backend-re7u.onrender.com";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});
