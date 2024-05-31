
import { SceneConfig } from "../src_refactoring/Config";
import { Scene } from "../src_refactoring/Scene";
import { ModelUtils } from "../src_refactoring/core/common/ModelUtils";
import { TiantAnalysisChecker, TiantAnalysisSolver } from "../src_refactoring/core/dataflow/TiantAnalysis";


// const config_path = "tests\\resources\\ifds\\project\\ifdsProjectConfig.json";
const config_path = "tests\\resources\\ifds\\TiantAnalysis\\ifdsTestConfig.json";
let config: SceneConfig = new SceneConfig();
config.buildFromJson2(config_path);
const scene = new Scene(config);
scene.inferTypes()
const defaultMethod = scene.getFiles()[0].getDefaultClass().getDefaultArkMethod();
let method = ModelUtils.getMethodWithName("T1",defaultMethod!);
// method = defaultMethod;
// let cancel = ModelUtils.getMethodWithName("taskpool.cancel", defaultMethod!);
// console.log(cancel!.getSignature().toString())
let source = ModelUtils.getMethodWithName("source",defaultMethod!);
let sink = ModelUtils.getMethodWithName("sink",defaultMethod!);
// let source2 = ModelUtils.getMethodWithName("source2",defaultMethod!);
// let sink2 = ModelUtils.getMethodWithName("sink2",defaultMethod!);
if(method){
    const problem = new TiantAnalysisChecker([...method.getCfg().getBlocks()][0].getStmts()[method.getParameters().length],method);
    problem.setSinks([sink!]);
    problem.setSources([source!]);
    // problem.addSinksFromJson("tests/resources/ifds/TiantAnalysis/sinkPath.json");
    // problem.addSourcesFromJson("tests/resources/ifds/TiantAnalysis/sourcePath.json");
    const solver = new TiantAnalysisSolver(problem, scene);
    solver.solve();
    debugger
}
