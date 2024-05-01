import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ModelUtils } from "../src/core/common/ModelUtils";
import { UndefinedVariableChecker, UndefinedVariableSolver } from "../src/core/dataflow/UndefinedVariable";

const config_path = "tests\\resources\\ifds\\UndefinedVariable\\ifdsTestConfig.json";
// const config_path = "tests\\resources\\cfg\\CfgTestConfig.json";
// const config_path = "tests\\resources\\ifds\\project\\ifdsProjectConfig.json";
let config: SceneConfig = new SceneConfig();
config.buildFromJson(config_path);
const scene = new Scene(config);
const classMap = scene.getClassMap();
const defaultMethod = scene.getFiles()[0].getDefaultClass().getDefaultArkMethod();
const method = ModelUtils.getMethodWithName("U2",defaultMethod!);
if(method){
    const problem = new UndefinedVariableChecker([...method.getCfg().getBlocks()][0].getStmts()[method.getParameters().length],method);
    const solver = new UndefinedVariableSolver(problem, scene);
    solver.solve();
    debugger
}
