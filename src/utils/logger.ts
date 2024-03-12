import type { Logger } from 'log4js';
import { configure, getLogger } from 'log4js';

export enum LOG_LEVEL {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    TRACE = 'TRACE',
}

export default class ConsoleLogger {
    public static configure(logFilePath: string, level: LOG_LEVEL): void {
        configure({
            appenders: {
                file: {
                    type: 'fileSync',
                    filename: `${logFilePath}`,
                    maxLogSize: 5 * 1024 * 1024,
                    backups: 5,
                    compress: true,
                    encoding: 'utf-8',
                    layout: {
                        type: 'pattern',
                        pattern: '[%d] [%p] [%z] - %m%n',
                    },
                },
                console: {
                    type: 'console',
                },
            },
            categories: {
                default: {
                    appenders: ['console'],
                    level: 'info',
                    enableCallStack: false,
                },
                codelinter: {
                    appenders: ['file'],
                    level,
                    enableCallStack: true,
                },
            },
        });
    }

    public static getLogger(): Logger {
        return getLogger('default');
    }

    public static serLogLevel(level: LOG_LEVEL): void {
        getLogger('default').level = level;
    }
}