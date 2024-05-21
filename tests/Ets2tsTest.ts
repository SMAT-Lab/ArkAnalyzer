import { spawnSync } from 'child_process';
import * as path from 'path';
import Logger from "../src/utils/logger";

const logger = Logger.getLogger();
logger.level = 'ALL';

let projectPath = 'tests/resources/viewtree';
let output = 'out';
let etsLoaderPath = '/mnt/d/Programs/Huawei/sdk/openharmony/9/ets/build-tools/ets-loader/';
async function run() {
    let startTime = new Date().getTime();
    logger.info('run.');
    let result = await spawnSync('node', ['-r', 'ts-node/register', path.join(__dirname, '../src/utils/Ets2ts.ts'), etsLoaderPath, projectPath, output, 'projectName', 'ets2ts.log'], {encoding: 'utf-8'});
    let endTime = new Date().getTime();
    if (result.status != 0) {
        logger.error('ets2ts err is: ', result.stderr);
    }
    logger.info(`used time ${(endTime - startTime)/1000} s`);
}

run();