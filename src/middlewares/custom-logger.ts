import stringify from 'json-stringify-safe';
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  socket: 3,
  debug: 5,
  silly: 6,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  socket: 'magenta',
  debug: 'blue',
  silly: 'white',
};

winston.addColors(colors);

const getLevel = () => {
  const env = process.env.ENVIRONMENT || 'dev';
  return env === 'prod' ? 'info' : 'debug';
};

class Logger {
  private _logger?: winston.Logger;

  get logger() {
    if (!this._logger) {
      throw new Error('Logger not initialized.');
    }
    return this._logger;
  }

  initialize(
    level?: 'error' | 'warn' | 'info' | 'http' | 'debug' | 'silly' | 'socket'
  ) {
    this._logger = winston.createLogger({
      level: level ? level : getLevel(),
      levels,
      transports: [new winston.transports.Console()],
      handleExceptions: true,
    });
  }

  info(...message: any[]) {
    this.logger.log('info', message);
  }
  debug(...message: any[]) {
    this.logger.log('debug', message);
  }
  error(...message: any[]) {
    this.logger.log('error', message);
  }
  warn(...message: any[]) {
    this.logger.log('warn', message);
  }
  silly(...message: any[]) {
    this.logger.log('silly', message);
  }
  http(...message: any[]) {
    this.logger.log('http', message);
  }
  socket(...message: any[]) {
    this.logger.log('socket', message);
  }
}

export const loggerInstance = new Logger();
