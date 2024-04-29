export declare class Logger {
    private customLevels;
    private logger;
    constructor();
    info(msg: any, meta?: any): void;
    warn(msg: any, meta?: any): void;
    error(msg: any, meta?: any): void;
    fatal(msg: any, meta?: any): void;
}
