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

import fs from 'fs';
import path from 'path';
import Logger, { LOG_MODULE_TYPE } from './logger';
import { FileUtils } from './FileUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'getAllFiles');
/**
 * 从指定目录中提取指定后缀名的所有文件
 * @param srcPath string 要提取文件的项目入口，相对或绝对路径都可
 * @param exts string[] 要提取的文件扩展名数组，每个扩展名需以点开头
 * @param filenameArr string[] 用来存放提取出的文件的原始路径的数组，可不传，默认为空数组
 * @param visited: Set<string> 用来存放已经访问过的路径，避免递归栈溢出，可不传，默认为空数组
 * @return string[] 提取出的文件的原始路径数组
 */
export function getAllFiles(
    srcPath: string,
    exts: string[],
    ignore: string[] = [],
    filenameArr: string[] = [],
    visited: Set<string> = new Set<string>()
): string[] {
    let ignoreFiles: Set<string> = new Set(ignore);
    // 如果源目录不存在，直接结束程序
    if (!fs.existsSync(srcPath)) {
        logger.error(`Input directory ${srcPath} is not exist, please check!`);
        return filenameArr;
    }

    // 获取src的绝对路径
    const realSrc = fs.realpathSync(srcPath);
    if (visited.has(realSrc)) {
        return filenameArr;
    }
    visited.add(realSrc);

    // 遍历src，判断文件类型
    fs.readdirSync(realSrc).forEach(filename => {
        if (ignoreFiles.has(filename)) {
            return;
        }
        // 拼接文件的绝对路径
        const realFile = path.resolve(realSrc, filename);

        //TODO: 增加排除文件后缀和目录

        // 如果是目录，递归提取
        if (FileUtils.isDirectory(realFile)) {
            getAllFiles(realFile, exts, ignore, filenameArr, visited);
        } else {
            // 如果是文件，则判断其扩展名是否在给定的扩展名数组中
            if (exts.includes(path.extname(filename))) {
                filenameArr.push(realFile);
            }
        }
    });
    return filenameArr;
}
