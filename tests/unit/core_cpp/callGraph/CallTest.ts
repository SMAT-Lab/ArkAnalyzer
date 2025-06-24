
import fs from 'fs';
import { SceneConfig } from '../../../../src';
import { DEFAULT_ARK_CLASS_NAME } from '../../../../src/core_cpp/common/Const';
import { CallGraph } from '../../../../src/callgraph_cpp/model/CallGraph';
import { CallGraphBuilder } from '../../../../src/callgraph_cpp/model/builder/CallGraphBuilder';
import { Scene } from '../../../../src';
import { MethodSignature } from '../../../../src';

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir('../../../resources_cpp/call_graph/');

function runScene(config: SceneConfig, fileName: string) {
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDirCpp(config);
    projectScene.inferTypesCpp();

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
    callGraph.dump('../out/callTest.dot');
    const content1 = fs.readFileSync('../out/callTest.dot', 'utf-8').replace(/\s+/g, '');
    const content2 = fs.readFileSync('cg/callTest.dot', 'utf-8').replace(/\s+/g, '');
    console.log('Are the files equal?', content1 === content2);
}

runScene(config, 'callTest.cpp');