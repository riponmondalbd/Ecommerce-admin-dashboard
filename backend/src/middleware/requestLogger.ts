import morgan from 'morgan';
import { logger } from '../utils/logger';
import { Request } from 'express';

/**
 * Custom morgan token and format for structured logging.
 */
const customFormat = ':method :url :status - :response-time ms';

export const requestLogger = morgan(customFormat, {
  stream: {
    write: (message) => {
      const logMessage = message.trim();
      logger.info(logMessage);
    },
  },
});

/**
 * Skip logging health check or static asset requests in development.
 */
export const shouldLog = (req: Request) => {
  return !req.url?.startsWith('/health') && !req.url?.match(/\.(png|jpg|css|js)$/i);
};
