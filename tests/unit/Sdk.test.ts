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

import { SdkUtils } from '../../src/core/common/SdkUtils';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';
import { ArkClass, ArkMethod, MethodSignature, Scene, SceneConfig, } from '../../src';
import { Sdk } from '../../src/Config';

const SDK_DIR = path.join(__dirname, '../../tests/resources/Sdk');

function buildScene(sdks: Sdk[]): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildConfig(path.basename(SDK_DIR), SDK_DIR, sdks);
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    return scene;
}

describe('SDK Global Map Test', () => {
    const sdk: Sdk = {
        name: '',
        path: SDK_DIR,
        moduleName: ''
    };
    const scene = buildScene([sdk]);

    it('test common sdk signature', async () => {
        const sdks = scene.getSdkArkFiles();
        const apiFile = '@ohos.web.webview.d.ts';
        const apiNS = 'webview';
        const apiCls = 'WebStorage';
        const apiName = 'getOrigins';
        sdks.forEach(sdk => {
            if (sdk.getName().endsWith(apiFile)) {
                const method = sdk.getNamespaceWithName(apiNS)?.getClassWithName(apiCls)?.getStaticMethodWithName(apiName);
                assert.isDefined(method);
                assert.isNull(method?.getImplementationSignature());
                assert.isNull(method?.getLineCol());
                const declareSigs = method?.getDeclareSignatures();
                assert.isDefined(declareSigs);
                assert.isNotNull(declareSigs);
                expect(declareSigs?.length).toEqual(2);
                expect(method?.getDeclareLines()).toEqual([190, 191]);
                expect(method?.getDeclareColumns()).toEqual([9, 9]);
                expect((declareSigs as MethodSignature[])[0].toString()).toEqual(`@/api/${apiFile}: ${apiNS}.${apiCls}.[static]${apiName}()`);
                expect((declareSigs as MethodSignature[])[0].getType().toString()).toEqual('@/api/@internal/Promise.d.ts: Promise<@/api/@ohos.web.webview.d.ts: webview.WebStorageOrigin[]>');
                expect((declareSigs as MethodSignature[])[1].toString())
                    .toEqual(`@/api/${apiFile}: ${apiNS}.${apiCls}.[static]${apiName}(AsyncCallback<@/api/@ohos.web.webview.d.ts: webview.WebStorageOrigin[]>)`);
                expect((declareSigs as MethodSignature[])[1].getType().toString()).toEqual('void');
            }
        });
    });

    it('test internal sdk', async () => {
        const key = 'wrapBuilder';
        const apiFile = '@internal/component/ets/common.d.ts';
        const apiCls = '%dflt';
        const apiName = 'wrapBuilder';
        const arkMethod = scene.getSdkGlobal(key);
        assert.isTrue(arkMethod instanceof ArkMethod);
        assert.isNull((arkMethod as ArkMethod).getImplementationSignature());

        const declareSignatures = (arkMethod as ArkMethod).getDeclareSignatures();
        const declareLines = (arkMethod as ArkMethod).getDeclareLines();
        const declareColumns = (arkMethod as ArkMethod).getDeclareColumns();
        assert.isNotNull(declareSignatures);
        expect(declareSignatures?.length).toEqual(1);
        expect((declareSignatures as MethodSignature[])[0].toString())
            .toEqual(`@/api/${apiFile}: ${apiCls}.${apiName}(@/api/${apiFile}: ${apiCls}.%AM2(Args))`);
        expect((declareSignatures as MethodSignature[])[0].getType().toString()).toEqual(`@/api/${apiFile}: WrappedBuilder<Args extends @ES2015/BuiltinClass: Object[]>`);
        expect(declareLines).toEqual([3503]);
        expect(declareColumns).toEqual([1]);
    });

    it('test local value default Method', async () => {
        const key = 'ColumnInterface';
        const apiFile = '@internal/component/ets/column.d.ts';
        const apiMethod = 'create';
        const arkClass = scene.getSdkGlobal(key);
        assert.isTrue(arkClass instanceof ArkClass);

        const method = (arkClass as ArkClass).getMethodWithName(apiMethod);
        assert.isNotNull(method);
        assert.isNull((method as ArkMethod).getImplementationSignature());

        const declareSignatures = (method as ArkMethod).getDeclareSignatures();
        const declareLines = (method as ArkMethod).getDeclareLines();
        const declareColumns = (method as ArkMethod).getDeclareColumns();
        assert.isNotNull(declareSignatures);
        expect(declareSignatures?.length).toEqual(1);
        expect((declareSignatures as MethodSignature[])[0].toString())
            .toEqual(`@/api/${apiFile}: ${key}.${apiMethod}(@/api/@internal/component/ets/column.d.ts: ColumnOptions)`);
        expect((declareSignatures as MethodSignature[])[0].getType().toString()).toEqual('@/api/@internal/component/ets/column.d.ts: ColumnAttribute');
        expect(declareLines).toEqual([26]);
        expect(declareColumns).toEqual([5]);
    });

    it('test sdk import map for scope-prefixed files', async () => {
        const sdk: Sdk = { name: '', path: SDK_DIR, moduleName: '' };
        let config: SceneConfig = new SceneConfig();
        config.buildConfig(path.basename(SDK_DIR), SDK_DIR, [sdk]);
        let scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        const sdkFile = SdkUtils.getImportSdkFile('@ohos.web.webview');
        assert.isDefined(sdkFile);
        expect(sdkFile?.getName()).toContain('@ohos.web.webview.d.ts');
    });

    it('test sdk import map for api-prefixed files', async () => {
        const sdk: Sdk = { name: '', path: SDK_DIR, moduleName: '' };
        let config: SceneConfig = new SceneConfig();
        config.buildConfig(path.basename(SDK_DIR), SDK_DIR, [sdk]);
        let scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        const sdkFile = SdkUtils.getImportSdkFile('@internal/Promise');
        assert.isDefined(sdkFile);
        expect(sdkFile?.getName()).toContain('@internal/Promise.d.ts');
    });
});
