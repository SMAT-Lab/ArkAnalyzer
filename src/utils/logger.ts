/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Logger } from 'log4js';
import { configure, getLogger } from 'log4js';

export enum LOG_LEVEL {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    TRACE = 'TRACE',
}

export enum LOG_MODULE_TYPE {
    DEFAULT = 'default',
    ARKANALYZER = 'ArkAnalyzer',
    HOMECHECK = 'HomeCheck',
    TOOL = 'Tool',
}

export default class ConsoleLogger {
    private static isConfigure: boolean = false;
    public static configure(logFilePath: string = "out/arkAnalyzer.log",
                            app_level: LOG_LEVEL = LOG_LEVEL.INFO,
                            tool_level: LOG_LEVEL = LOG_LEVEL.INFO
    ): void {
        this.isConfigure = true;
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
                        pattern: '[%d] [%p] [%z] [%X{module}] - [%X{tag}] %m',
                    },
                },
                console: {
                    type: 'console',
                    layout: {
                        type: 'pattern',
                        pattern: '[%d] [%p] [%z] [%X{module}] - [%X{tag}] %m',
                    },
                },
            },
            categories: {
                default: {
                    appenders: ['console'],
                    level: 'info',
                    enableCallStack: false,
                },
                ArkAnalyzer: {
                    appenders: ['file'],
                    level: app_level,
                    enableCallStack: true,
                },
                HomeCheck: {
                    appenders: ['file'],
                    level: app_level,
                    enableCallStack: true,
                },
                Tool: {
                    appenders: ['file'],
                    level: tool_level,
                    enableCallStack: true,
                },
            },
        });
    }

    public static getLogger(log_type: LOG_MODULE_TYPE, tag: string = '-'): Logger {
        if (!this.isConfigure){
            this.configure();
        }
        let logger = getLogger(log_type);
        logger.addContext('module', log_type);
        logger.addContext('tag', tag);
        return logger;
    }
}
