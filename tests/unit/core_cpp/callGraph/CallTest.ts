
import fs from 'fs';
import { SceneConfig } from '../../../../src';
import { DEFAULT_ARK_CLASS_NAME } from '../../../../src/core_cpp/common/Const';
import { CallGraph } from '../../../../src/callgraph_cpp/model/CallGraph';
import { CallGraphBuilder } from '../../../../src/callgraph_cpp/model/builder/CallGraphBuilder';
import { SceneCpp } from '../../../../src/Scene_cpp';
import { MethodSignature } from '../../../../src/core_cpp/model/ArkSignature';

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir('resources_cpp/callTest/');

function runScene(config: SceneConfig, fileName: string) {
    let projectScene: SceneCpp = new SceneCpp();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    let entryPoints: MethodSignature[] = [];
    // @ts-ignore
    entryPoints.push(...projectScene.getFiles()
        .filter(arkFile => arkFile.getName() === fileName)
        .flatMap(arkFile => arkFile.getClasses())
        .filter(arkClass => arkClass.getName() === DEFAULT_ARK_CLASS_NAME)
        .flatMap(arkClass => arkClass.getMethods())
        .filter(arkMethod => arkMethod.getName() === "main")
        .map(arkMethod => arkMethod.getSignature())
    );

    let callGraph = new CallGraph(projectScene);
    let callGraphBuilder = new CallGraphBuilder(callGraph, projectScene);
    callGraphBuilder.buildClassHierarchyCallGraph(entryPoints, false);
    callGraph.dump("out/cg/cg.dot");
    const content1 = fs.readFileSync('out/cg/cg.dot', 'utf-8').replace(/\s+/g, '');
    const content2 = fs.readFileSync('graph_expect/cg.dot', 'utf-8').replace(/\s+/g, '');
    console.log('Are the files equal?', content1 === content2);
}

runScene(config, 'callTest.cpp');