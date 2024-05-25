import {SceneConfig} from "../src/Config";
import {Scene} from "../src/Scene";
import Logger, {LOG_LEVEL} from "../src/utils/logger";

const logPath = 'out\\SceneTest.log';
const logger = Logger.getLogger();
Logger.configure(logPath, LOG_LEVEL.INFO);

class SceneTest {
    public async testTsWholePipline() {
        logger.error('testTsWholePipline start');
        const buildConfigStartTime = new Date().getTime();
        logger.error(`memoryUsage before buildConfig in bytes:`);
        logger.error(process.memoryUsage());

        // build config
        const configPath = "tests\\resources\\scene\\SceneTestConfig.json";
        let sceneConfig: SceneConfig = new SceneConfig();
        await sceneConfig.buildFromJson(configPath);

        logger.error(`memoryUsage after buildConfig in bytes:`);
        logger.error(process.memoryUsage());
        const buildConfigEndTime = new Date().getTime();
        logger.error('projectFiles cnt:', sceneConfig.getProjectFiles().size);
        logger.error(`buildConfig took ${(buildConfigEndTime - buildConfigStartTime) / 1000} s`);

        // build scene
        let scene = new Scene(sceneConfig);
        logger.error(`memoryUsage after buildScene in bytes:`);
        logger.error(process.memoryUsage());
        const buildSceneEndTime = new Date().getTime();
        logger.error(`buildScene took ${(buildSceneEndTime - buildConfigEndTime) / 1000} s`);

        // infer types
        scene.inferTypes();
        logger.error(`memoryUsage after inferTypes in bytes:`);
        logger.error(process.memoryUsage());
        const inferTypesEndTime = new Date().getTime();
        logger.error(`inferTypes took ${(inferTypesEndTime - buildSceneEndTime) / 1000} s`);

        // get viewTree
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                arkClass.getViewTree();
            }
        }
        logger.error(`memoryUsage after get viewTree in bytes:`);
        logger.error(process.memoryUsage());
        const getViewTreeEndTime = new Date().getTime();
        logger.error(`get viewTree took ${(getViewTreeEndTime - inferTypesEndTime) / 1000} s`);

        logger.error('testTsWholePipline end\n');
    }

    public async testETsWholePipline() {
        logger.error('testETsWholePipline start');
        // build config
        const etsProjectPath = 'D:\\Codes\\openharmony\\applications\\applications_photos';
        const outputPath = 'out/ets2ts';
        const sdkEtsPath = 'C:\\Users\\kubrick\\AppData\\Local\\Huawei\\Sdk\\openharmony\\9\\ets';
        const projectName = 'applications_photos';
        const nodePath = 'node';
        const buildConfigStartTime = new Date().getTime();
        logger.info(`memoryUsage before EtsConfig in bytes:`);
        logger.info(process.memoryUsage());

        const sceneConfig: SceneConfig = new SceneConfig();
        // await sceneConfig.buildConfig(projectName, etsProjectPath, outputPath, sdkEtsPath, logPath, nodePath);

        logger.info(`memoryUsage after EtsConfig in bytes:`);
        logger.info(process.memoryUsage());

        logger.error(`memoryUsage after buildConfig in bytes:`);
        logger.error(process.memoryUsage());
        const buildConfigEndTime = new Date().getTime();
        logger.error('projectFiles cnt:', sceneConfig.getProjectFiles().size);
        logger.error(`buildConfig took ${(buildConfigEndTime - buildConfigStartTime) / 1000} s`);

        // build scene
        let scene = new Scene(sceneConfig);
        logger.error(`memoryUsage after buildScene in bytes:`);
        logger.error(process.memoryUsage());
        const buildSceneEndTime = new Date().getTime();
        logger.error(`buildScene took ${(buildSceneEndTime - buildConfigEndTime) / 1000} s`);

        // infer types
        scene.inferTypes();
        logger.error(`memoryUsage after inferTypes in bytes:`);
        logger.error(process.memoryUsage());
        const inferTypesEndTime = new Date().getTime();
        logger.error(`inferTypes took ${(inferTypesEndTime - buildSceneEndTime) / 1000} s`);

        // get viewTree
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                arkClass.getViewTree();
            }
        }
        logger.error(`memoryUsage after get viewTree in bytes:`);
        logger.error(process.memoryUsage());
        const getViewTreeEndTime = new Date().getTime();
        logger.error(`get viewTree took ${(getViewTreeEndTime - inferTypesEndTime) / 1000} s`);
        logger.error(`eTsWholePipline took ${(getViewTreeEndTime - buildConfigStartTime) / 1000} s`);
        logger.error('testETsWholePipline end\n');
    }

    public async testEtsConfig() {
        logger.info('testEtsConfig start');
        let etsConfigStartTime = new Date().getTime();

        const etsProjectPath = 'D:\\Codes\\openharmony\\applications\\applications_photos';
        const outputPath = 'D:\\Codes\\resources\\applications';
        const sdkEtsPath = 'C:\\Users\\kubrick\\AppData\\Local\\OpenHarmony\\Sdk\\11\\ets';
        const projectName = 'applications_photos_ts';
        const nodePath = 'node';

        logger.info(`memoryUsage before EtsConfig in bytes:`);
        logger.info(process.memoryUsage());

        const sceneConfig: SceneConfig = new SceneConfig();
        await sceneConfig.buildFromIde(projectName, etsProjectPath, outputPath, sdkEtsPath, logPath, nodePath);

        logger.info(`memoryUsage after EtsConfig in bytes:`);
        logger.info(process.memoryUsage());

        logger.info('projectFiles cnt:', sceneConfig.getProjectFiles().size);

        let etsConfigEndTime = new Date().getTime();
        logger.info(`etsConfig took ${(etsConfigEndTime - etsConfigStartTime) / 1000} s`);
        logger.info('testEtsConfig end\n');
    }
}

let sceneTest = new SceneTest();
// sceneTest.testETsWholePipline();
// sceneTest.testTsWholePipline();
sceneTest.testEtsConfig();