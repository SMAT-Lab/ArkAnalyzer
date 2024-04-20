import {SceneConfig} from "../src/Config";
import {Scene} from "../src/Scene";
import Logger, {LOG_LEVEL} from "../src/utils/logger";
import {Ets2ts} from "../src/utils/Ets2ts";
import * as ts from "typescript";
import convertCompilerOptions = ts.server.convertCompilerOptions;

const logPath = 'out\\SceneTest.log';
const logger = Logger.getLogger();
Logger.configure(logPath, LOG_LEVEL.INFO);

class SceneTest {
    public buildScene(): Scene {
        // tests\\resources\\scene\\mainModule
        // D:\\Codes\\resources\\selected_apps
        const config_path = "tests\\resources\\scene\\SceneTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        // Logger.setLogLevel(LOG_LEVEL.INFO);
        logger.error('projectFiles cnt:', config.getProjectFiles().length);
        return new Scene(config);
    }

    public testLogger(): void {
        let scene = this.buildScene();
        logger.info('info');
        logger.warn('info');
        logger.error('error');
    }

    public testTsWholePipline(): void {
        logger.error('testTsWholePipline start');
        const buildConfigStartTime = new Date().getTime();
        logger.error(`memoryUsage before buildConfig in bytes:`);
        logger.error(process.memoryUsage());

        const configPath = "tests\\resources\\scene\\SceneTestConfig.json";
        let sceneConfig: SceneConfig = new SceneConfig();
        sceneConfig.buildFromJson(configPath);

        logger.error(`memoryUsage after buildConfig in bytes:`);
        logger.error(process.memoryUsage());
        const buildConfigEndTime = new Date().getTime();
        logger.error('projectFiles cnt:', sceneConfig.getProjectFiles().length);
        logger.error(`buildConfig took ${(buildConfigEndTime - buildConfigStartTime) / 1000} s`);

        let scene = new Scene(sceneConfig);
        logger.error(`memoryUsage after buildScene in bytes:`);
        logger.error(process.memoryUsage());
        const buildSceneEndTime = new Date().getTime();
        logger.error(`buildScene took ${(buildSceneEndTime - buildConfigEndTime) / 1000} s`);

        scene.inferTypes();
        logger.error(`memoryUsage after inferTypes in bytes:`);
        logger.error(process.memoryUsage());
        const inferTypesEndTime = new Date().getTime();
        logger.error(`inferTypes took ${(inferTypesEndTime - buildSceneEndTime) / 1000} s`);
        logger.error('testTsWholePipline end');
    }

    public async testEts2ts() {
        logger.info('testEts2ts start');
        let ets2tsStartTime = new Date().getTime();

        const etsProjectPath = 'D:\\Codes\\openharmony\\applications\\applications_photos';
        const outputPath = 'out/ets2ts';
        const etsLoaderPath = 'C:\\Users\\kubrick\\AppData\\Local\\Huawei\\Sdk\\openharmony\\9\\ets\\build-tools\\ets-loader';
        const projectName = 'applications_photos';

        logger.info(`memoryUsage before Ets2ts in bytes:`);
        logger.info(process.memoryUsage());

        let ets2ts = new Ets2ts();
        await ets2ts.init(etsLoaderPath, etsProjectPath, outputPath, projectName);
        await ets2ts.compileProject();

        logger.info(`memoryUsage after Ets2ts in bytes:`);
        logger.info(process.memoryUsage());

        let ets2tsEndTime = new Date().getTime();
        logger.info(`ets2ts took ${(ets2tsEndTime - ets2tsStartTime) / 1000} s`);
        logger.info('testEts2ts end\n');
    }

    public async testEtsConfig() {
        logger.info('testEtsConfig start');
        let etsConfigStartTime = new Date().getTime();

        const etsProjectPath = 'D:\\Codes\\openharmony\\applications\\applications_photos';
        const outputPath = 'out/ets2ts';
        const hosBasePath = 'C:\\Users\\kubrick\\AppData\\Local\\Huawei\\Sdk\\openharmony\\9';
        const hosSdkVersion = 9;
        const projectName = 'applications_photos';

        logger.info(`memoryUsage before EtsConfig in bytes:`);
        logger.info(process.memoryUsage());

        const sceneConfig: SceneConfig = new SceneConfig();
        await sceneConfig.buildFromIde(projectName, etsProjectPath, outputPath, hosBasePath, hosSdkVersion, logPath);

        logger.info(`memoryUsage after EtsConfig in bytes:`);
        logger.info(process.memoryUsage());

        logger.info('projectFiles cnt:', sceneConfig.getProjectFiles().length);

        let etsConfigEndTime = new Date().getTime();
        logger.info(`etsConfig took ${(etsConfigEndTime - etsConfigStartTime) / 1000} s`);
        logger.info('testEtsConfig end\n');
    }
}

let sceneTest = new SceneTest();
// sceneTest.buildScene();
sceneTest.testTsWholePipline();
// sceneTest.testEts2ts();
// sceneTest.testEtsConfig();