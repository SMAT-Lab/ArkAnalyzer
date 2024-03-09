import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { Value } from "../src/core/base/Value";

export class VisibleValueTest {
    public buildScene(): Scene {
        // tests\\resources\\visiblevalue\\mainModule
        const config_path = "tests\\resources\\visiblevalue\\VisibleValueTestTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testSimpleVisibleValue(): void {
        const scene = visibleValueTest.buildScene();
        const visibleValue = scene.getVisibleValue();

        for (const arkFile of scene.arkFiles) {
            // console.log('=============== arkFile:', arkFile.getName(), '================');
            visibleValue.updateIntoScope(arkFile);
            this.printVisibleValues(visibleValue.getCurrVisibleValues());
            for (const arkClass of arkFile.getClasses()) {
                if (arkClass.getName() == '_DEFAULT_ARK_CLASS') {
                    continue;
                }

                // console.log('======== arkClass:', arkClass.getName(), '========');
                visibleValue.updateIntoScope(arkClass);
                this.printVisibleValues(visibleValue.getCurrVisibleValues());
                for (const arkMethod of arkClass.getMethods()) {
                    // console.log('==== arkMethod:', arkMethod.getName(), '====');
                    visibleValue.updateIntoScope(arkMethod);
                    this.printVisibleValues(visibleValue.getCurrVisibleValues());

                    const cfg = arkMethod.getBody().getCfg();
                    for (const block of cfg.getBlocks()) {
                        // console.log('==== block{', block.toString(), '}');
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
        console.log('*** visible values ***');
        for (const value of values) {
            console.log(value.toString());
        }
    }
}

const visibleValueTest = new VisibleValueTest();
// const scene = visibleValueTest.buildScene();
visibleValueTest.testSimpleVisibleValue();




debugger