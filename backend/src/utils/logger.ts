type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<LogLevel, string> = {
  info: '\x1b[32m',    // green
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  debug: '\x1b[36m',   // cyan
};

const reset = '\x1b[0m';

function formatMessage(level: LogLevel, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const color = colors[level];
  const formattedArgs = args.map((arg) =>
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
  );
  return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${formattedArgs.join(' ')}`;
}

export const logger = {
  info: (...args: unknown[]) => console.log(formatMessage('info', ...args)),
  warn: (...args: unknown[]) => console.warn(formatMessage('warn', ...args)),
  error: (...args: unknown[]) => console.error(formatMessage('error', ...args)),
  debug: (...args: unknown[]) => console.debug(formatMessage('debug', ...args)),
};
