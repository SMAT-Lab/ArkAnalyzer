import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { Value } from "../src/core/base/Value";
import Logger, { LOG_LEVEL } from "../src/utils/logger";

const logger = Logger.getLogger();

export class VisibleValueTest {
    public buildScene(): Scene {
        // tests\\resources\\visiblevalue\\mainModule
        const config_path = "tests\\resources\\visiblevalue\\VisibleValueTestTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        Logger.setLogLevel(LOG_LEVEL.INFO);
        return new Scene(config);
    }

    public testSimpleVisibleValue(): void {
        const scene = visibleValueTest.buildScene();
        const visibleValue = scene.getVisibleValue();

        for (const arkFile of scene.arkFiles) {
            // logger.info('=============== arkFile:', arkFile.getName(), '================');
            visibleValue.updateIntoScope(arkFile);
            this.printVisibleValues(visibleValue.getCurrVisibleValues());
            for (const arkClass of arkFile.getClasses()) {
                if (arkClass.getName() == '_DEFAULT_ARK_CLASS') {
                    continue;
                }

                // logger.info('======== arkClass:', arkClass.getName(), '========');
                visibleValue.updateIntoScope(arkClass);
                this.printVisibleValues(visibleValue.getCurrVisibleValues());
                for (const arkMethod of arkClass.getMethods()) {
                    // logger.info('==== arkMethod:', arkMethod.getName(), '====');
                    visibleValue.updateIntoScope(arkMethod);
                    this.printVisibleValues(visibleValue.getCurrVisibleValues());

                    const cfg = arkMethod.getBody().getCfg();
                    for (const block of cfg.getBlocks()) {
                        // logger.info('==== block{', block.toString(), '}');
                        visibleValue.updateIntoScope(block);
                        this.printVisibleValues(visibleValue.getCurrVisibleValues());

                        visibleValue.updateOutScope();
                        this.printVisibleValues(visibleValue.getCurrVisibleValues());
                    }

                    visibleValue.updateOutScope();
                    this.printVisibleValues(visibleValue.getCurrVisibleValues());
                }
                visibleValue.updateOutScope();
                this.printVisibleValues(visibleValue.getCurrVisibleValues());
            }
            visibleValue.updateOutScope();
            this.printVisibleValues(visibleValue.getCurrVisibleValues());
        }
    }

    private printVisibleValues(values: Value[]): void {
        logger.info('*** visible values ***');
        for (const value of values) {
            logger.info(value.toString());
        }
    }

    public testScopeChain(): void {
        const scene = visibleValueTest.buildScene();
        const visibleValue = scene.getVisibleValue();

        for (const arkFile of scene.arkFiles) {
            logger.info('=============== arkFile:', arkFile.getName(), '================');
            visibleValue.updateIntoScope(arkFile);
            let scopeChain = visibleValue.getScopeChain();
            logger.info(scopeChain[0].depth);
        }
    }
}

const visibleValueTest = new VisibleValueTest();
// const scene = visibleValueTest.buildScene();
// visibleValueTest.testSimpleVisibleValue();
visibleValueTest.testScopeChain();




debugger