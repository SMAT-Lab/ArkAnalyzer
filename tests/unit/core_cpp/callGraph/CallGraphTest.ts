import fs from 'fs';
import { SceneConfig } from '../../../../src';
import { DEFAULT_ARK_CLASS_NAME } from '../../../../src';
import { CallGraph } from '../../../../src';
import { CallGraphBuilder } from '../../../../src';
import { Scene } from '../../../../src';
import { MethodSignature } from '../../../../src';

let config: SceneConfig = new SceneConfig();
config.buildFromProjectDir('../../../resources_cpp/call_graph/');

function runScene(config: SceneConfig, fileName: string) {
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDirCpp(config);
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
    callGraph.dump('../cg_out/Tests.dot');
    const content1 = fs.readFileSync('../cg_out/Tests.dot', 'utf-8').replace(/\s+/g, '');
    const content2 = fs.readFileSync('cg/Tests.dot', 'utf-8').replace(/\s+/g, '');
    console.log('Are the files equal?', content1 === content2);
}

runScene(config, 'Tests.cpp');