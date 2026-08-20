import 'sharp';
import './config/env.mjs';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import http from 'http';
import passport from './config/passport.mjs';
import { initSocket } from './config/socket.mjs';
import libraryRoutes from './routes/library.routes.mjs';
import authRoutes from './routes/auth.routes.mjs';
import userRoutes from './routes/user.routes.mjs';
import dashboardRoutes from './routes/dashboard.user.routes.mjs';
import dashboardLibrarianRoutes from './routes/dashboard.librarian.routes.mjs';
import { runStartupPinCleanup, startPeriodicPinCleanup } from './utils/pinScheduler.mjs';
import searchRoutes from './routes/search.routes.mjs';
import historyRoutes from './routes/history.routes.mjs';
import roomRoutes from './routes/room.routes.mjs';
import announcementRoutes from './routes/announcement.routes.mjs';
import { runStartupCleanup as runStartupAnnouncementCleanup, startPeriodicCleanup as startPeriodicAnnouncementCleanup } from './utils/announcementScheduler.mjs';
import wishlistRoutes from './routes/wishlist.routes.mjs';
import recommendationRoutes from './routes/recommendation.routes.mjs';
import { stopPythonServer } from './services/recommendation.services.mjs';
import { initScheduler, stopSchedulerChildren } from './services/scheduler.services.mjs';
import studyGroupRoutes from './routes/study-group.routes.mjs';
import systemConfigurationRoutes from './routes/system-configuration.routes.mjs';
import { systemConfigurationService } from './services/system-configuration.services.mjs';
import adminRoutes from './routes/admin.routes.mjs';
import statisticsRoutes from './routes/statistics.routes.mjs';
import authorizationRoutes from './routes/authorization.routes.mjs';
import notificationRoutes from './routes/notification.routes.mjs';
import { getAllowedOrigins, validateEnvironment } from './config/env.mjs';
import { globalApiLimiter, verifyCsrf } from './middlewares/security.middleware.mjs';


const app = express();
const allowedOrigins = getAllowedOrigins();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use(globalApiLimiter);
app.use(verifyCsrf);
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/dashboard/user', dashboardRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/study-groups', studyGroupRoutes);
app.use('/api/dashboard/admin/system-configuration', systemConfigurationRoutes);
app.use('/dashboard/librarian', dashboardLibrarianRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/statistics', statisticsRoutes);
app.use('/api/authorization', authorizationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(libraryRoutes);
app.use(searchRoutes);
app.use(historyRoutes);
app.use(recommendationRoutes);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const startServer = async () => {
  try {
    validateEnvironment();
    await systemConfigurationService.initialize();
    initSocket(server);
    runStartupPinCleanup();
    startPeriodicPinCleanup();
    runStartupAnnouncementCleanup();
    startPeriodicAnnouncementCleanup();
    initScheduler();
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup aborted: system configuration is unavailable.', error.cause || error);
    process.exitCode = 1;
  }
};

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } });
  }
  if (error?.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ success: false, error: { code: 'CORS_ORIGIN_DENIED', message: error.message } });
  }
  return next(error);
});

startServer();

const shutdown = (signal) => {
  stopPythonServer();
  stopSchedulerChildren();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

export { app, server, startServer };
