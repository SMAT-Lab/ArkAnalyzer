/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME, Scene, SceneConfig, Stmt } from '../../../../src';
import path from 'path';
import { assert, describe, expect, it } from 'vitest';
import { ArkClass } from '../../../../src/core/model/ArkClass';
import { ArkMethod } from '../../../../src/core/model/ArkMethod';
import { ArkNamespace } from '../../../../src/core/model/ArkNamespace';
import { ArkMetadataKind, CommentsMetadata, JSDocMetadata, JSDocTagItem } from '../../../../src/core/model/ArkMetadata';
import { Stmt_Metadata_Expected } from '../../../resources/model/metadata/MetadataExpect';

describe('metadata Test', () => {
    const scene = buildScene('');

    it('test stmt metadata', async () => {
        assertStmtsMetadataEqual(scene, 'MetadataTest.ts', Stmt_Metadata_Expected.stmts);
    });

    it('test jsdoc metadata for namespace interface method class', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith('JSDocMetadata.ts'));
        assert.isDefined(arkFile);

        const namespace = arkFile?.getNamespaceWithName('JsDocNamespace');
        assert.isDefined(namespace);
        assertNamespaceJSDocMetadata(namespace!);

        const interfaceClass = namespace?.getClassWithName('JsDocInterface');
        assert.isDefined(interfaceClass);
        assertInterfaceJSDocMetadata(interfaceClass!);

        const classModel = namespace?.getClassWithName('JsDocClass');
        assert.isDefined(classModel);
        assertClassJSDocMetadata(classModel!);

        const method = classModel?.getMethodWithName('run');
        assert.isDefined(method);
        assertMethodJSDocMetadata(method!);
    });

    it('test duplicated jsdoc blocks stored as multiple metadata entries', async () => {
        const arkFile = scene.getFiles().find((file) => file.getName().endsWith('JSDocMetadata.ts'));
        assert.isDefined(arkFile);

        const namespace = arkFile?.getNamespaceWithName('JsDocNamespace');
        const classModel = namespace?.getClassWithName('JsDocClass');
        const method = classModel?.getMethodWithName('run');
        assert.isDefined(classModel);
        assert.isDefined(method);

        const classJsDocMetadata = getJSDocMetadata(classModel!);
        const methodJsDocMetadata = getJSDocMetadata(method!);
        expect(classJsDocMetadata.length).toEqual(2);
        expect(methodJsDocMetadata.length).toEqual(2);
    });
});

const BASE_DIR = path.join(__dirname, '../../../../tests/resources/model/metadata');

function buildScene(folderName: string): Scene {
    const sceneOptions = { enableTrailingComments: true, enableLeadingComments: true, enableJSDoc: true };
    let config: SceneConfig = new SceneConfig(sceneOptions);
    config.buildFromProjectDir(path.join(BASE_DIR, folderName));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

function assertStmtsMetadataEqual(scene: Scene, fileName: string, expectStmts: any[],
                                  className: string = DEFAULT_ARK_CLASS_NAME,
                                  methodName: string = DEFAULT_ARK_METHOD_NAME): void {
    const arkFile = scene.getFiles().find((file) => file.getName().endsWith(fileName));
    const arkMethod = arkFile?.getClassWithName(className)?.getMethods()
        .find((method) => (method.getName() === methodName));
    const stmts = arkMethod?.getCfg()?.getStmts();
    if (!stmts) {
        assert.isDefined(stmts);
        return;
    }

    expect(stmts.length).toEqual(expectStmts.length);
    for (let i = 0; i < stmts.length; i++) {
        expect(stmts[i].toString()).toEqual(expectStmts[i].text);

        const actualLeadingComments = getCommentsMetadata(stmts[i], ArkMetadataKind.LEADING_COMMENTS);
        expect(actualLeadingComments).toEqual(expectStmts[i].leadingComments);

        const actualTrailingComments = getCommentsMetadata(stmts[i], ArkMetadataKind.TRAILING_COMMENTS);
        expect(actualTrailingComments).toEqual(expectStmts[i].trailingComments);
    }
}

function getCommentsMetadata(model: Stmt | { getMetadata: (kind: ArkMetadataKind) => unknown }, metadataKind: ArkMetadataKind): any[] {
    const commentsMetadata = model.getMetadata(metadataKind);
    if (!(commentsMetadata instanceof CommentsMetadata)) {
        return [];
    }
    return commentsMetadata.getComments().map(comment => ({
        content: comment.content,
        position: [
            comment.position.getFirstLine(),
            comment.position.getFirstCol(),
            comment.position.getLastLine(),
            comment.position.getLastCol(),
        ],
    }));
}

function getJSDocMetadata(model: Stmt | { getMetadata: (kind: ArkMetadataKind) => unknown }): JSDocMetadata[] {
    const metadata = model.getMetadata(ArkMetadataKind.JSDOC);
    if (!Array.isArray(metadata)) {
        return [];
    }
    return metadata.filter(item => item instanceof JSDocMetadata);
}

function assertNamespaceJSDocMetadata(namespace: ArkNamespace): void {
    const namespaceJsDocMetadata = getJSDocMetadata(namespace);
    expect(namespaceJsDocMetadata.length).toEqual(1);
    expect(namespaceJsDocMetadata[0].getDescription()).toEqual('namespace jsdoc');
    expect(namespaceJsDocMetadata[0].getParams()).toEqual([]);
    expect(namespaceJsDocMetadata[0].getTags()).toEqual([
        { name: 'namespace', description: 'JsDocNamespace' },
        { name: 'syscap', description: 'SystemCapability.Communication.Bluetooth.Core' },
        { name: 'since', description: '7' },
        { name: 'deprecated', description: 'since 9' },
        { name: 'useinstead', description: 'ohos.bluetoothManager' },
    ]);
}

function assertInterfaceJSDocMetadata(interfaceClass: ArkClass): void {
    const interfaceJsDocMetadata = getJSDocMetadata(interfaceClass);
    expect(interfaceJsDocMetadata.length).toEqual(1);
    expect(interfaceJsDocMetadata[0].getDescription()).toEqual('Base interface of profile.');
    expect(interfaceJsDocMetadata[0].getParams()).toEqual([]);
    expect(interfaceJsDocMetadata[0].getTags()).toEqual([
        { name: 'typedef', description: 'BaseProfile' },
        { name: 'syscap', description: 'SystemCapability.Communication.Bluetooth.Core' },
        { name: 'since', description: '7' },
        { name: 'deprecated', description: 'since 9' },
        { name: 'useinstead', description: 'ohos.bluetoothManager/bluetoothManager.BaseProfile' },
    ]);
}

function assertClassJSDocMetadata(classModel: ArkClass): void {
    const classJsDocMetadata = getJSDocMetadata(classModel);
    expect(classJsDocMetadata.length).toEqual(2);
    expect(classJsDocMetadata[0].getDescription()).toEqual('The definition of AI Agent controller.');
    expect(classJsDocMetadata[0].getParams()).toEqual([]);
    expect(classJsDocMetadata[0].getTags()).toEqual([
        { name: 'syscap', description: 'SystemCapability.AI.Agent.AgentKit' },
        { name: 'since', description: '6.0.0(20)' },
    ]);
    expect(classJsDocMetadata[1].getDescription()).toEqual('The definition of AI Agent controller.');
    expect(classJsDocMetadata[1].getParams()).toEqual([]);
    expect(classJsDocMetadata[1].getTags()).toEqual([
        { name: 'syscap', description: 'SystemCapability.AI.Agent.AgentKit' },
        { name: 'atomicservice', description: '' },
        { name: 'since', description: '6.0.1(21)' },
    ]);
}

const METHOD_RUN_JSDOC_DESCRIPTION = 'If agent kit is supported for the application';

const METHOD_RUN_JSDOC_PARAMS = [
    { name: 'context', type: 'common.UIAbilityContext', description: 'the context of application.' },
    { name: 'agentId', type: 'string', description: 'the agent ID.' },
];

const METHOD_RUN_JSDOC_RETURNS = [{ type: 'Promise<boolean>', description: '.' }];

const METHOD_RUN_JSDOC_THROWS = [
    { type: 'BusinessError', description: '1022400010 - Parameter error.' },
    { type: 'BusinessError', description: '1022400011 - Privacy agreement not accepted.' },
    { type: 'BusinessError', description: '1022400013 - Internet error.' },
    { type: 'BusinessError', description: '1022400014 - Internal error.' },
];

const METHOD_RUN_JSDOC_TAGS_FIRST = [
    { name: 'syscap', description: 'SystemCapability.AI.Agent.AgentKit' },
    { name: 'since', description: '6.0.0(20)' },
];

const METHOD_RUN_JSDOC_TAGS_SECOND = [
    { name: 'syscap', description: 'SystemCapability.AI.Agent.AgentKit' },
    { name: 'atomicservice', description: '' },
    { name: 'since', description: '6.0.1(21)' },
];

function expectMethodRunJSDocBlock(jsDoc: JSDocMetadata, tags: JSDocTagItem[]): void {
    expect(jsDoc.getDescription()).toEqual(METHOD_RUN_JSDOC_DESCRIPTION);
    expect(jsDoc.getParams()).toEqual(METHOD_RUN_JSDOC_PARAMS);
    expect(jsDoc.getTags()).toEqual(tags);
    expect(jsDoc.getReturns()).toEqual(METHOD_RUN_JSDOC_RETURNS);
    expect(jsDoc.getThrows()).toEqual(METHOD_RUN_JSDOC_THROWS);
}

function assertMethodJSDocMetadata(method: ArkMethod): void {
    const methodJsDocMetadata = getJSDocMetadata(method);
    expect(methodJsDocMetadata.length).toEqual(2);
    expectMethodRunJSDocBlock(methodJsDocMetadata[0], METHOD_RUN_JSDOC_TAGS_FIRST);
    expectMethodRunJSDocBlock(methodJsDocMetadata[1], METHOD_RUN_JSDOC_TAGS_SECOND);
}