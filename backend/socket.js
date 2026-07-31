"use strict";

let io;

// userId -> socketId
const onlineUsers = new Map();

const initSocket = (socketIo) => {
  io = socketIo;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized.");
  }
  return io;
};

const getOnlineUsersCount = () => onlineUsers.size;

const getOnlineUsers = () => [...onlineUsers.keys()];

module.exports = {
  initSocket,
  getIO,
  onlineUsers,
  getOnlineUsers,
  getOnlineUsersCount,
};
