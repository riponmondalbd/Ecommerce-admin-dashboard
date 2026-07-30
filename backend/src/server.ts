import http from 'http';
import app from './app';
import { env } from './config/env';

/**
 * Create HTTP server instance
 */
const server = http.createServer(app);

/**
 * Start the server
 */
const PORT = env.port || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, reason);
  // Typically you'd want to close the process here
  // server.close(() => process.exit(1));
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await new Promise((resolve) => server.close(resolve));
  process.exit(0);
});
