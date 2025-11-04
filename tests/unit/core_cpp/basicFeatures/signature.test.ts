/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { assert, describe, expect, it } from 'vitest';
import { Scene, SceneConfig, ClassType } from '../../../../src';
import path from 'path';

// Standard library header file configuration for DevEco
const deveco_c = process.env.DEVECO_C;

function buildScene(folderName: string): Scene {
    let config: SceneConfig = new SceneConfig();
    config.setSupportFileExts(['.c', '.cpp', '.h', '.hpp']);
    let includeDirs: string[] = [];
    if (deveco_c != undefined) {
        // header file configuration for DevEco
        includeDirs.push(path.join(deveco_c, 'c++', 'v1'));
    }
    config.buildFromProjectDir(folderName, includeDirs);
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    return scene;
}

describe('Signature Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources_cpp/basicFeatures/signature'));

    it('case1: file signature test', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        assert.isDefined(arkFile);
        const fileSignature = arkFile!.getFileSignature();
        expect(fileSignature.getProjectName()).toEqual('signature');
        expect(fileSignature.getFileName()).toEqual('signature.cpp');
    });

    it('case2: namespace signature test', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const namespace = arkFile?.getNamespaces().find(ns => ns.getName() === 'nsA');
        assert.isDefined(namespace);
        const nsSignature = namespace!.getSignature();
        expect(nsSignature.getDeclaringFileSignature().getFileName()).toEqual('signature.cpp');
        expect(nsSignature.getDeclaringFileSignature().getProjectName()).toEqual('signature');
    });

    it('case3: class signature test1', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const namespace = arkFile?.getNamespaces().find(ns => ns.getName() === 'nsA');
        const targetClass = namespace?.getClasses().find(cls => cls.getName() === 'DefaultClass');
        assert.isDefined(targetClass);
        const clsSignature = targetClass!.getSignature();
        expect(clsSignature.toString()).toEqual('@signature/signature.cpp: nsA.DefaultClass');
    });

    it('case4: class signature test2', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const targetClass = arkFile?.getClasses().find(cls => cls.getName() === 'Base');
        assert.isDefined(targetClass);
        const clsSignature = targetClass!.getSignature();
        expect(clsSignature.toString()).toEqual('@signature/signature.cpp: Base');
    });

    it('case5: method signature test1', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const namespace = arkFile?.getNamespaces().find(ns => ns.getName() === 'nsA');
        const targetMethod = namespace?.getClasses().find(cls => cls.isDefaultArkClass())?.getMethodWithName('Func');
        assert.isDefined(targetMethod);
        const signature = targetMethod!.getSignature();
        expect(signature.toString()).toEqual('@signature/signature.cpp: nsA.%dflt.Func()');
    });

    it('case6: method signature test2', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const namespace = arkFile?.getNamespaces().find(ns => ns.getName() === 'nsA');
        const targetMethod = namespace?.getClasses().find(
            cls => cls.getName() === 'DefaultClass')?.getMethodWithName('constructor');
        assert.isDefined(targetMethod);
        const signature = targetMethod!.getSignature();
        expect(signature.toString()).toEqual('@signature/signature.cpp: nsA.DefaultClass.constructor(char, int)');
    });

    it('case7: method signature test3', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const targetMethod = arkFile?.getClasses().find(
            cls => cls.getName() === 'Base')?.getMethodWithName('constructor');
        assert.isDefined(targetMethod);
        const signature = targetMethod!.getSignature();
        expect(signature.toString()).toEqual('@signature/signature.cpp: Base.constructor(char&)');
    });

    it('case8: field signature test1', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const namespace = arkFile?.getNamespaces().find(ns => ns.getName() === 'nsA');
        const targetClass = namespace?.getClasses().find(cls => cls.getName() === 'DefaultClass');
        const field = targetClass?.getFields().find(field => field.getName() === 'name');
        assert.isDefined(field);
        const signature = field!.getSignature();
        console.log(signature.toString());
        expect(signature.toString()).toEqual('@signature/signature.cpp: nsA.DefaultClass.name');
    });

    it('case9: field signature test2', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const targetClass = arkFile?.getClasses().find(cls => cls.getName() === 'Base');
        const field = targetClass?.getFields().find(field => field.getName() === 'name');
        assert.isDefined(field);
        const signature = field!.getSignature();
        console.log(signature.toString());
        expect(signature.toString()).toEqual('@signature/signature.cpp: Base.name');
    });

    it('case10: alias type signature', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const targetMethod = arkFile?.getDefaultClass().getDefaultArkMethod();
        assert.isDefined(targetMethod);
        const aliasType = targetMethod!.getBody()?.getAliasTypeByName('BaseAlias');
        assert.isDefined(aliasType);
        expect((aliasType!.getOriginalType() as ClassType).getClassSignature().toString()).toEqual('@signature/signature.cpp: Base');
        expect(aliasType!.getSignature().toString()).toEqual('@signature/signature.cpp: %dflt.[static]%dflt()#BaseAlias');
    });

    it('case11: invokeExpr signature', () => {
        const arkFile = scene.getFiles().find(file => file.getName().endsWith('signature.cpp'));
        const targetMethod = arkFile?.getDefaultClass().getMethodWithName('main');
        assert.isDefined(targetMethod);
        const stmts = targetMethod!.getCfg()!.getStmts();
        expect(stmts[1].getInvokeExpr()?.getMethodSignature().toString()).toEqual('@signature/signature.cpp: nsA.%dflt.Func()');
        expect(stmts[3].getInvokeExpr()?.getMethodSignature().toString()).toEqual('@signature/signature.cpp: nsA.DefaultClass.constructor(char, int)');
        expect(stmts[5].getInvokeExpr()?.getMethodSignature().toString()).toEqual('@signature/signature.cpp: nsA.DefaultClass.GetAge()');
        expect(stmts[7].getInvokeExpr()?.getMethodSignature().toString()).toEqual('@signature/signature.cpp: Base.constructor(char&)');
        expect(stmts[9].getInvokeExpr()?.getMethodSignature().toString()).toEqual('@signature/signature.cpp: Base.GetName()');
    });

});