import {SceneConfig} from "../src/Config";
import {Scene} from "../src/Scene";
import Logger, {LOG_LEVEL} from "../src/utils/logger";

const logger = Logger.getLogger();
Logger.configure('out\\SceneTest.log', LOG_LEVEL.ERROR);

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

    public testwholePipline(): void {
        logger.error('testwholePipline start');
        const buildSceneStartTime = new Date().getTime();
        let scene = this.buildScene();
        const buildSceneEndTime = new Date().getTime();
        logger.error(`buildScene took ${(buildSceneEndTime - buildSceneStartTime) / 1000} s`);
        scene.inferTypes();
        const inferTypesEndTime = new Date().getTime();
        logger.error(`inferTypes took ${(inferTypesEndTime - buildSceneEndTime) / 1000} s`);
        logger.error('testwholePipline end');
    }

    private sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    public async testFileScene() {
        logger.error('testFileScene start');
        const configPath = "tests\\resources\\scene\\SceneTestConfig.json";
        const config = new SceneConfig();
        config.buildFromJson(configPath);

        const projectName = config.getTargetProjectName();
        const projectDirectory = config.getTargetProjectDirectory();
        const logPath = config.getLogPath();
        logger.error('projectFiles cnt:', config.getProjectFiles().length);

        for (const filePath of config.getProjectFiles()) {
            const fileConfig = new SceneConfig();
            fileConfig.buildFromIdeSingle(projectName, projectDirectory, filePath, logPath);
            const scene = new Scene(fileConfig);
            scene.inferTypes();

            // await this.sleep(300);
        }
        logger.error('testFileScene end');
    }
}

// logger.error('scene test start');
let sceneTest = new SceneTest();
// sceneTest.buildScene();
sceneTest.testwholePipline();
// sceneTest.testFileScene();
// logger.error('scene test end');