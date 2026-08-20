import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './postgres.mjs';
import { getAllowedOrigins } from './env.mjs';
import { ACCESS_COOKIE, JWT_AUDIENCE, JWT_ISSUER } from '../utils/authHelpers.mjs';

let io;

const parseCookies = (header = '') => Object.fromEntries(
  String(header).split(';').map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }).filter(([key]) => key),
);

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: getAllowedOrigins(), credentials: true, methods: ['GET', 'POST'] },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies[ACCESS_COOKIE] || socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], issuer: JWT_ISSUER, audience: JWT_AUDIENCE,
      });
      if (!decoded?.userId) return next(new Error('Authentication error: Token has no userId'));
      const result = await pool.query(
        'SELECT token_version, status, role, branch_id FROM public.users WHERE user_id = $1',
        [decoded.userId],
      );
      const stored = result.rows[0];
      if (!stored || stored.status !== 'active' || (decoded.token_version ?? 0) !== (stored.token_version ?? 0)) {
        return next(new Error('Authentication error: Account or token is no longer valid'));
      }
      socket.userId = decoded.userId;
      socket.branchId = stored.branch_id ?? null;
      socket.role = stored.role;
      return next();
    } catch {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.branchId != null) socket.join(`branch:${socket.branchId}`);
  });
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io has not been initialized.');
  return io;
};

export const disconnectUserSockets = (userId) => {
  if (io && userId) {
    io.in(`user:${userId}`).disconnectSockets(true);
  }
};

export const suspendUserSockets = (userId) => {
  if (io && userId) {
    const userRoom = `user:${userId}`;
    io.in(userRoom).emit('account:suspended', {
      code: 'USER_SUSPENDED',
      message: 'Your account has been suspended. You will be disconnected.'
    });
    setTimeout(() => {
      io.in(userRoom).disconnectSockets(true);
    }, 500);
  }
};

export const emitStudyGroupChanged = (groupId, changeType) => {
  if (io) io.emit('study-group:changed', { groupId, changeType });
};

export const emitUserNotification = (userId, notification) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
};

export const emitNotificationRead = (userId, notificationId) => {
  if (io && userId) io.to(`user:${userId}`).emit('notification:read', { notificationId });
};

export const emitRoomDashboardChanged = (branchId, changeType) => {
  if (io && branchId != null) io.to(`branch:${branchId}`).emit('room-dashboard:changed', { changeType, branchId });
};

export const emitAuthorizationChanged = (entry) => {
  if (io) io.emit('authorization:changed', entry);
};
