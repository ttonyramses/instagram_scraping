/* eslint-disable @typescript-eslint/no-explicit-any */
import { injectable } from 'inversify';
import {
  createLogger,
  transports,
  format,
  Logger as LoggerWinston,
} from 'winston';
@injectable()
export class Logger {
  private logDirectory: string;
  private customLevels = {
    levels: {
      trace: 5,
      debug: 4,
      info: 3,
      warn: 2,
      error: 1,
      fatal: 0,
    },
    colors: {
      trace: 'blue',
      debug: 'green',
      info: 'green',
      warn: 'yellow',
      error: 'red',
      fatal: 'red',
    },
  };

  private logger: LoggerWinston;

  constructor() {
    this.logDirectory = process.env.LOG_DIR || 'logs';
    this.logger = createLogger({
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }), // Inclure le stack d'erreur
        format.printf((info) => {
          const stack = info.stack ? '\n'+info.stack : '';
          return `[${info.timestamp}] [${info.level}]: ${info.message} ${info.slat || ''} ${stack}`;
        }),
      ),
      transports: [
        new transports.Console(),
        new transports.File({
          filename: this.logDirectory+'/instagram_scraping_error.log',
          level: 'error',
        }),
        new transports.File({
          filename: this.logDirectory+'/instagram_scraping_activity.log',
          level: process.env.LOG_LEVEL || 'info',
        }),
      ],
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  public info(msg: any, meta?: any) {
    this.logger.info(msg, meta);
  }

  public debug(msg: any, meta?: any) {
    this.logger.debug(msg, meta);
  }

  public warn(msg: any, meta?: any) {
    this.logger.warn(msg, meta);
  }

  public error(msg: any, meta?: any) {
    this.logger.error(msg, meta);
  }

  public fatal(msg: any, meta?: any) {
    this.logger.log('fatal', msg, meta);
  }
}
