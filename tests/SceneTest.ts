import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import Logger, { LOG_LEVEL } from "../src/utils/logger";

const logger = Logger.getLogger();
Logger.configure('out\\log.txt', LOG_LEVEL.ERROR);
class SceneTest {
    public buildScene(): Scene {
        // tests\\resources\\scene\\mainModule
        // D:\\Codes\\resources\\selected_apps
        const config_path = "tests\\resources\\scene\\SceneTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        // Logger.setLogLevel(LOG_LEVEL.INFO);
        return new Scene(config);
    }

    public testLogger(): void {
        let scene = this.buildScene();
        logger.info('info');
        logger.warn('info');
        logger.error('error');
    }

    public testwholePipline(): void {
        let scene = this.buildScene();
        // scene.inferTypes();
    }
}

logger.error('scene test start');
let sceneTest = new SceneTest();
// sceneTest.buildScene();
// sceneTest.testLogger();
sceneTest.testwholePipline();
logger.error('scene test end');