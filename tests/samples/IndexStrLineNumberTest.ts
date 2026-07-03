import { SceneConfig, Scene, DEFAULT_ARK_METHOD_NAME } from '../../src';

const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/myanalysis');
const scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferTypes();

for (const arkFile of scene.getFiles()) {
    if (!arkFile.getName().endsWith('index_str_1026.ts')) continue;
    console.log('File:', arkFile.getName());

    for (const arkClass of arkFile.getClasses()) {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() === DEFAULT_ARK_METHOD_NAME) continue;
            console.log('  Method:', arkMethod.getName());

            const body = arkMethod.getBody();
            if (!body) continue;

            const blocks = [...body.getCfg().getBlocks()];
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                for (const stmt of block.getStmts()) {
                    const pos = stmt.getOriginPositionInfo();
                    console.log(`    [line ${pos.getLineNo()}] ${stmt.toString()}`);
                }
                const succText = [...block.getSuccessors()].map(b => blocks.indexOf(b)).join(', ');
                console.log(`    -> succ [${succText}]`);
            }
            console.log();
        }
    }
}
