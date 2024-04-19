import { Ets2ts } from '../src/utils/Ets2ts';
import Logger from "../src/utils/logger";

const logger = Logger.getLogger();
logger.level = 'ALL';

let projectPath = '/mnt/d/code/oh/OpenHarmony/applications/standard/systemui';
let output = '/mnt/d/code/oh/OpenHarmony/applications/ets2ts';
let etsLoaderPath = '/mnt/d/Programs/Huawei/sdk/openharmony/9/ets/build-tools/ets-loader';
async function run() {
    let startTime = new Date().getTime();
    logger.info('run.');
    let ets2ts: Ets2ts | undefined = new Ets2ts();
    logger.info('init.');
    await ets2ts.init(etsLoaderPath, projectPath, output, 'projectName');
    logger.info('compile project start.');
    await ets2ts.compileProject();
    logger.info('compile project down.');
    let endTime = new Date().getTime();
    logger.info(`used time ${(endTime - startTime)/1000} s`);
}

run();