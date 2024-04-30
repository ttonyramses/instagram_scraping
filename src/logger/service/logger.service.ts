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
    this.logger = createLogger({
      transports: [new transports.Console()],
    });
  }

  public info(msg: any, meta?: any) {
    this.logger.info(msg, meta);
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
