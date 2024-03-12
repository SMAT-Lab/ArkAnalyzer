import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import Logger from "../src/utils/logger";

const logger = Logger.getLogger();
class SceneTest {
    public buildScene(): Scene {
        // tests\\resources\\scene\\mainModule
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
}

let sceneTest = new SceneTest();
// sceneTest.buildScene();
sceneTest.testLogger();