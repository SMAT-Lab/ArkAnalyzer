import { spawnSync } from 'child_process';
import * as path from 'path';
import Logger from "../src/utils/logger";

const logger = Logger.getLogger();
logger.level = 'ALL';

let projectPath = 'tests/resources/viewtree';
let output = 'tests/resources/viewtree';
let etsLoaderPath = '/home/sunbo/ArkTS2TS';
async function run() {
    let startTime = new Date().getTime();
    logger.info('run.');
    await spawnSync('node', ['-r', 'ts-node/register', path.join(__dirname, '../src/utils/Ets2ts.ts'), etsLoaderPath, projectPath, output, 'projectName', 'ets2ts.log']);
    let endTime = new Date().getTime();
    logger.info(`used time ${(endTime - startTime)/1000} s`);
}

run();