import { env } from './config/env';
import app from './app';
import { logger } from './utils/logger';

const PORT = env.port;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} [${env.nodeEnv}]`);
});

/**
 * Graceful shutdown on SIGTERM and SIGINT.
 */
const shutdown = (signal: string) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${JSON.stringify(reason)}`);
  process.exit(1);
});

export default server;
