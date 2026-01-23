/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { assert, describe, it } from 'vitest';
import path from 'path';
import {
    AliasType,
    ArkAssignStmt,
    ArkClass,
    ArkInstanceFieldRef,
    ArkInvokeStmt,
    ArkNamespace,
    ArkNewArrayExpr,
    ArkStaticFieldRef,
    ArrayType,
    ClassType,
    DEFAULT_ARK_CLASS_NAME,
    DEFAULT_ARK_METHOD_NAME,
    FileSignature,
    NumberType,
    Scene,
    SceneConfig,
    StringType
} from '../../src';
import Logger, { LOG_LEVEL, LOG_MODULE_TYPE } from '../../src/utils/logger';
import { ArkIRClassPrinter } from '../../src/save/arkir/ArkIRClassPrinter';
import { ModifierType } from '../../src/core/model/ArkBaseModel';
import { ArkIRFilePrinter } from '../../src/save/arkir/ArkIRFilePrinter';
import { ArkIRMethodPrinter } from '../../src/save/arkir/ArkIRMethodPrinter';

const logPath = 'out/ArkAnalyzer.log';
const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'InferArrayTest');
Logger.configure(logPath, LOG_LEVEL.DEBUG, LOG_LEVEL.DEBUG);

describe("Infer Array Test", () => {

    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/inferType"));
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();

    it('normal case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('test_new_array');
        assert.isDefined(method);
        const stmt = method?.getCfg()?.getStmts()[2];
        assert.isTrue(stmt instanceof ArkAssignStmt);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp() instanceof ArkNewArrayExpr);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp().getType() instanceof ArrayType);
        assert.isTrue((stmt as ArkAssignStmt).getLeftOp().getType() instanceof ArrayType);
    })

    it('array case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('testArray');
        const stmt = method?.getCfg()?.getStmts()[2];
        assert.isTrue(stmt instanceof ArkAssignStmt);
        const type = (stmt as ArkAssignStmt).getLeftOp().getType();
        assert.isTrue(type instanceof ArrayType);
        assert.isTrue((type as ArrayType).getBaseType() instanceof NumberType);
    })

    it('array Expr case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('arrayExpr');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[1].toString(), '%0 = newarray (number)[0]');
            assert.equal(stmts[2].toString(), '%1 = newarray (string)[0]');
            assert.equal(stmts[3].toString(), '%2 = newarray (@inferType/inferSample.ts: Sample)[0]');
            assert.equal(stmts[4].toString(), '%3 = newarray (string|@inferType/inferSample.ts: Sample)[2]');
            assert.equal(stmts[5].toString(), '%4 = newarray (any)[0]');
        }
    })

    it('array Literal case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('arrayLiteral');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[1].toString(), '%0 = newarray (number)[3]');
            assert.equal(stmts[6].toString(), '%1 = newarray (string)[2]');
            assert.equal(stmts[12].toString(), '%3 = newarray (@inferType/inferSample.ts: Sample)[1]');
            assert.equal(stmts[15].toString(), '%4 = newarray (number|string)[2]');
            assert.equal(stmts[19].toString(), '%5 = newarray (any)[0]');
            assert.equal(stmts[23].toString(), '%7 = newarray (number|string|@inferType/inferSample.ts: Sample)[3]');
        }
    })

    it('testInstanceofArray', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('testArrayInstacnceOf')?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        assert.equal(stmts?.[6].toString(), '%1 = a instanceof @built-in/lib.es5.d.ts: Array<T>');
    })

    it('fieldRef to ArrayRef case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('test_new_array');
        const stmts = method?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[10].toString(), 'c = %2[%3]');
            assert.equal(stmts[12].toString(), 's = %4[a]');
            assert.equal(stmts[14].toString(), 'n = %5[3]');
        }
    })

    it('global ref case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass().getMethodWithName('test1');
        const type = method?.getBody()?.getUsedGlobals()?.get('out')?.getType();
        assert.isTrue(type instanceof NumberType);

    })

    it('demo case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getClassWithName('StaticUserB')?.getMethodWithName('f1');
        const stmt = method?.getCfg()?.getStmts()[1];
        assert.isDefined(stmt);
        assert.isTrue((stmt as ArkAssignStmt).getLeftOp().getType() instanceof NumberType);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp() instanceof ArkStaticFieldRef);
    })

    it('embed namespace case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getDefaultClass()?.getMethodWithName('testDoubleNamespace');
        const stmts = method?.getCfg()?.getStmts();
        const stmt = stmts?.[stmts?.length - 2];
        assert.isDefined(stmt);
        assert.equal(stmt!.toString(), 'staticinvoke <@inferType/demo.ts: outer.inner.TestClass.[static]request()>()');
    })

    it('field case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Field.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getClassWithName('C2')?.getMethodWithName('f2');
        const stmt = method?.getCfg()?.getStmts()[2];
        assert.isDefined(stmt);
        assert.isTrue((stmt as ArkAssignStmt).getLeftOp().getType() instanceof ClassType);
        assert.isTrue((stmt as ArkAssignStmt).getRightOp() instanceof ArkInstanceFieldRef);
        assert.equal(file?.getClassWithName('C1')?.getFieldWithName('s')?.getType(), StringType.getInstance());
    })

    it('field type case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const fields = file?.getClassWithName('FieldType')?.getFields();
        if (fields) {
            const arkField = fields[0];
            assert.equal(arkField.getType().toString(), '(number|string)[]');
            assert.equal(fields[1].getType(), StringType.getInstance());
        }
    })

    it('embed class case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const embedClassType = file?.getDefaultClass().getMethodWithName('foo')?.getBody()?.getLocals().get('t')?.getType();
        assert.isDefined(embedClassType);
        if (embedClassType) {
            assert.equal(embedClassType.toString(), '@inferType/inferSample.ts: Test$%dflt-foo');
        }
    })

    it('global local ref case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const usedGlobals = file?.getNamespaceWithName('testGV1')?.getDefaultClass().getMethodWithName('increment')?.getBody()?.getUsedGlobals();
        assert.isDefined(usedGlobals);
        if (usedGlobals) {
            assert.equal(usedGlobals.get('fileGV')?.getType(), NumberType.getInstance());
            assert.equal(usedGlobals.get('counter')?.getType(), NumberType.getInstance());
        }
    })

    it('supperClass Test case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'B.ets');
        const classB = projectScene.getFile(fileId)?.getClassWithName('ClassB');
        assert.isDefined(classB?.getSuperClass());
        assert.isTrue(classB?.getFieldWithName('field1')?.getType() instanceof AliasType);
    })

    it('alias type Test case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'B.ets');
        const aliasType = projectScene.getFile(fileId)?.getDefaultClass().getDefaultArkMethod()?.getBody()?.getAliasTypeByName('TestType');
        assert.isTrue(aliasType?.getOriginalType() instanceof AliasType);
        assert.equal((aliasType?.getOriginalType() as AliasType).getOriginalType().getTypeString(), '@inferType/Target.ets: MySpace.%AC0<@inferType/Target.ets: MySpace.ClassTarget>');
    })

    it('constructor case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const returnType = file?.getClassWithName('Test')?.getMethodWithName('constructor')
            ?.getReturnType();
        assert.isTrue(returnType instanceof ClassType);
        assert.equal((returnType as ClassType).getClassSignature().toString(), '@inferType/demo.ts: Test');
    })

    it('all case', () => {
        projectScene.getMethods().forEach(m => {
            m.getCfg()?.getStmts().forEach(s => {
                const text = s.toString();
                if (text.includes('Unknown')) {
                    logger.log(text + ' warning ' + m.getSignature().toString());
                }
            })
        })
    })

    it('methodsMap refresh', () => {
        let flag = false;
        projectScene.getMethods().forEach(m => {
            if (m.getSignature().toString().includes('SCBTransitionManager.registerUnlockTransitionController(@inferType/test1.ets: SCBUnlockTransitionController')) {
                if (projectScene.getMethod(m.getSignature()) !== null) {
                    flag = true;
                }
            }
        })
        assert.isTrue(flag);
    })

    it('union array case', () => {
        let flag = false;
        const paramToString = `@inferType/UnionArray.ts: ${DEFAULT_ARK_CLASS_NAME}.[static]${DEFAULT_ARK_METHOD_NAME}()#ISceneEvent`;
        projectScene.getMethods().forEach(m => {
            if (m.getSignature().toString().includes(`${paramToString}[]|${paramToString}`)) {
                if (projectScene.getMethod(m.getSignature()) !== null) {
                    flag = true;
                }
            }
        })
        assert.isTrue(flag);
    })

    it('field to ArrayRef case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Field.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getClassWithName('User')?.getFieldWithName('role')?.getInitializer();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[2].toString(), '%3 = %1[%2]');
        }
    })

    it('instance of case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'demo.ts');
        const file = projectScene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('responseType')
            ?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[2].toString(), '%0 = d instanceof @inferType/demo.ts: Test');
            assert.equal(stmts[3].toString(), 'if %0 != false');
        }
    })

    it('any type case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'inferSample.ts');
        const file = projectScene.getFile(fileId);
        const arkExport = file?.getImportInfoBy('myNamespaceA')?.getLazyExportInfo()?.getArkExport();
        assert.isDefined((arkExport as ArkNamespace).getExportInfoBy('a')?.getArkExport());
    })

    it('import symbol form export *', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'exportAll/main/Index.ets');
        const file = projectScene.getFile(fileId);
        const arkExport = file?.getImportInfoBy('Ineterface2')?.getLazyExportInfo()?.getArkExport();
        assert.isTrue(arkExport instanceof ArkClass);
    })

    it('check export info not null', () => {
        projectScene.getFiles().forEach(file => {
            file.getExportInfos().forEach(e => assert.isNotNull(e.getArkExport()));
        })
    })

    it('ptr union type 2 function case', () => {
        const fileId = new FileSignature(projectScene.getProjectName(), 'Field.ts');
        const file = projectScene.getFile(fileId);
        const method = file?.getClassWithName('TestPTA')?.getMethodWithName('goo');
        const stmt = method?.getCfg()?.getStmts()[1];
        assert.equal(stmt?.toString(), 'ptrinvoke this.onClick2<@inferType/Field.ts: TestPTA.%AM1(number)>(2)');
    })

})

describe("function Test", () => {
    let config: SceneConfig = new SceneConfig();
    config.getSdksObj().push({ moduleName: "", name: "etsSdk", path: path.join(__dirname, "../resources/Sdk") })
    config.buildFromProjectDir(path.join(__dirname, "../resources/inferType"));
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('generic case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual = file?.getClassWithName('SCBSceneSessionManager')
            ?.getFieldWithName('property1')?.getSignature().getType().toString();
        assert.equal(actual, '@etsSdk/arkts/@arkts.collections.d.ets: collections.Array<number>');
    })

    it('overload case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual = file?.getDefaultClass()?.getMethodWithName('demoCallBack')
            ?.getCfg()?.getStmts();
        assert.equal((actual?.[1] as ArkInvokeStmt).getInvokeExpr().getMethodSignature().toString(),
            '@etsSdk/api/@ohos.multimedia.media.d.ts: media.%dflt.createAVPlayer(@etsSdk/api/@ohos.base.d.ts: AsyncCallback<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer,void>)');
        assert.equal((actual?.[2] as ArkAssignStmt).getInvokeExpr()?.getMethodSignature().toString(),
            '@etsSdk/api/@ohos.multimedia.media.d.ts: media.%dflt.createAVPlayer()');
    })

    it('callback case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual = file?.getDefaultClass()?.getMethodWithName('%AM0$demoCallBack')
            ?.getCfg()?.getStmts().find(s => s instanceof ArkInvokeStmt)?.toString();
        assert.equal(actual, 'instanceinvoke player.<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer.on(\'audioInterrupt\', @etsSdk/api/@ohos.base.d.ts: Callback<audio.InterruptEvent>)>(\'audioInterrupt\', %AM1$%AM0$demoCallBack)');
    })

    it('promise case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const actual2 = file?.getDefaultClass()?.getMethodWithName('%AM3$demoCallBack')
            ?.getCfg()?.getStmts().find(s => s instanceof ArkInvokeStmt)?.toString();
        assert.equal(actual2, 'instanceinvoke player.<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer.on(\'audioInterrupt\', @etsSdk/api/@ohos.base.d.ts: Callback<audio.InterruptEvent>)>(mode, %AM4$%AM3$demoCallBack)');
    })

    it('enum value type case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('testEnumValue')?.getCfg()?.getStmts();
        if (stmts) {
            assert.equal(stmts[3].toString(), 'staticinvoke <@etsSdk/api/@ohos.sensor.d.ts: sensor.%dflt.off(@etsSdk/api/@ohos.sensor.d.ts: sensor.SensorId.[static]GRAVITY, @etsSdk/api/@ohos.base.d.ts: Callback<@etsSdk/api/@ohos.sensor.d.ts: sensor.GravityResponse>)>(%1)');
            assert.equal(stmts[4].toString(), 'staticinvoke <@etsSdk/api/@ohos.sensor.d.ts: sensor.%dflt.off(@etsSdk/api/@ohos.sensor.d.ts: sensor.SensorId.[static]AMBIENT_LIGHT, @etsSdk/api/@ohos.base.d.ts: Callback<@etsSdk/api/@ohos.sensor.d.ts: sensor.LightResponse>)>(5)');
        }
    })

    it('function name same with param type', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const parameter = file?.getDefaultClass()?.getMethodWithName('ResponseType')?.getParameters()[0];
        if (parameter) {
            assert.equal(parameter.getType().toString(), '@etsSdk/api/@internal/component/ets/enums.d.ts: ResponseType');
        }
    })

    it('sdk import', () => {
        const fileId = new FileSignature('etsSdk', 'api/@internal/ets/lifecycle.d.ts');
        const file = scene.getFile(fileId);
        assert.isNotNull(file?.getImportInfoBy('AsyncCallback')?.getLazyExportInfo());
    })

    it('match override case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('%AM5$matchOverride')
            ?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[4].toString(), 'instanceinvoke player.<@etsSdk/api/@ohos.multimedia.media.d.ts: media.AVPlayer.on(\'stateChange\', @etsSdk/api/@ohos.multimedia.media.d.ts: media.%dflt.[static]%dflt()#OnAVPlayerStateChangeHandle)>(%0, %AM6$%AM5$matchOverride)');
        }
    })

    it('testArrayFrom', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const locals = file?.getDefaultClass()?.getMethodWithName('testArrayFrom')?.getBody()?.getLocals();
        assert.isDefined(locals)
        assert.isTrue(locals?.get('arr1')?.getType() instanceof ArrayType);
        assert.equal(locals?.get('arr2')?.getType().toString(), 'string[]');
    })

    it('testParamGenericWithConstraint', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('genericFunction')
            ?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[2].toString(), 'instanceinvoke a.<@inferType/inferSample.ts: TestInterface.callf()>()');
        }
    })

    it('testGenericWithDefaultSpread', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmts = file?.getDefaultClass()?.getMethodWithName('test2')
            ?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        if (stmts) {
            assert.equal(stmts[3].toString(), 'instanceinvoke a.<@inferType/inferSample.ts: Config2.ffff()>()');
        }
    })

    const BaseChangeInferIR = `class BaseChangeInfer {
  %instInit(): void {
    label0:
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      return
  }

  constructor(): @inferType/inferSample.ts: BaseChangeInfer {
    label0:
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      instanceinvoke this.<@inferType/inferSample.ts: BaseChangeInfer.%instInit()>()
      return this
  }

  static %statInit(): void {
    label0:
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      return
  }

  %AM0(): void

  string2String(): void {
    label0:
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      str = 'string'
      %0 = str.<@built-in/lib.es5.d.ts: String.length>
      instanceinvoke str.<@built-in/lib.es5.d.ts: String.toUpperCase()>()
      return
  }

  number2Number(): void {
    label0:
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      str = 13
      instanceinvoke str.<@built-in/lib.es5.d.ts: Number.toPrecision(number)>(2)
      return
  }

  boolean2Boolean(): void {
    label0:
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      str = true
      instanceinvoke str.<@built-in/lib.es5.d.ts: Boolean.valueOf()>()
      return
  }

  bigint2Wrapper(str: bigint): void {
    label0:
      str = parameter0: bigint
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      instanceinvoke str.<@built-in/lib.es2020.bigint.d.ts: BigInt.toLocaleString(Intl.LocalesArgument, @built-in/lib.es2020.bigint.d.ts: BigIntToLocaleStringOptions)>()
      %0 = Symbol.<@built-in/lib.es2015.symbol.wellknown.d.ts: SymbolConstructor.toStringTag>
      %1 = str.<@built-in/lib.es2020.bigint.d.ts: BigInt.%0>
      return
  }

  literal2Wrapper(a: '1', b: false, c: 3): void {
    label0:
      a = parameter0: '1'
      b = parameter1: false
      c = parameter2: 3
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      %0 = a.<@built-in/lib.es5.d.ts: String.length>
      instanceinvoke a.<@built-in/lib.es5.d.ts: String.charAt(number)>(0)
      instanceinvoke b.<@built-in/lib.es5.d.ts: Boolean.valueOf()>()
      instanceinvoke c.<@built-in/lib.es5.d.ts: Number.toExponential(number)>()
      return
  }

  function2Wrapper(callback: @inferType/inferSample.ts: BaseChangeInfer.%AM0(), d: @built-in/lib.es5.d.ts: Function): void {
    label0:
      callback = parameter0: @inferType/inferSample.ts: BaseChangeInfer.%AM0()
      d = parameter1: @built-in/lib.es5.d.ts: Function
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      %0 = callback.<@built-in/lib.es2015.core.d.ts: Function.name>
      ptrinvoke callback<@inferType/inferSample.ts: BaseChangeInfer.%AM0()>()
      %1 = d.<@built-in/lib.es5.d.ts: Function.length>
      %2 = ptrinvoke d<@built-in/lib.es5.d.ts: Function.call(@built-in/lib.es5.d.ts: Function, any, any[])>()
      instanceinvoke %2.<@%unk/%unk: .toString()>()
      return
  }

  enum2Wrapper(v: @inferType/inferSample.ts: Week): void {
    label0:
      v = parameter0: @inferType/inferSample.ts: Week
      this = this: @inferType/inferSample.ts: BaseChangeInfer
      %0 = @inferType/inferSample.ts: Week.[static]MON
      instanceinvoke %0.<@built-in/lib.es5.d.ts: Number.valueOf()>()
      t = @inferType/inferSample.ts: Week.[static]MON
      instanceinvoke t.<@built-in/lib.es5.d.ts: Number.valueOf()>()
      %1 = @inferType/inferSample.ts: Week.[static]TUE
      instanceinvoke %1.<@built-in/lib.es5.d.ts: String.valueOf()>()
      t = @inferType/inferSample.ts: Week.[static]TUE
      return
  }
}
`
    it('testBaseTypeTransfer', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const cls = file?.getClassWithName('BaseChangeInfer');
        assert.isDefined(cls);
        const printer = new ArkIRClassPrinter(cls!);
        const s1 = printer.dump();
        assert.equal(s1, BaseChangeInferIR);
    })

    it('test ns local', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmt = file?.getClassWithName('NameSpaceLocalTest')?.getMethodWithName('foo')?.getCfg()?.getStmts()[2];
        assert.equal(stmt?.toString(), '%0 = instanceinvoke %0.<@built-in/lib.es5.d.ts: Intl.%AC1.construct-signature(string|string[], @built-in/lib.es5.d.ts: Intl.NumberFormatOptions)>(\'123\')');
    })

    it('test array cat', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmt = file?.getClassWithName('ArrayCatTest')?.getMethodWithName('goo')?.getCfg()?.getStmts()[3];
        assert.equal(stmt?.toString(), 'arr33 = instanceinvoke arr11.<@built-in/lib.es5.d.ts: Array.concat(@built-in/lib.es5.d.ts: ConcatArray<T>[])>(arr22)');
    })

    it('pta union type CallBack 2 function case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'test2.ets');
        const file = scene.getFile(fileId);
        const method = file?.getClassWithName('TestCallback')?.getMethodWithName('foo');
        const stmt = method?.getCfg()?.getStmts()[1];
        assert.equal(stmt?.toString(), 'ptrinvoke this.myCallback<@etsSdk/api/@ohos.base.d.ts: Callback.create(T)>(\'abc\')');
    })

    it('import type', () => {
        const fileId = new FileSignature('etsSdk', 'api/@ohos.multimedia.media.d.ts');
        const file = scene.getFile(fileId);
        const image = file?.getImportInfoBy('image');
        assert.isDefined(image);
        assert.isTrue(image?.containsModifier(ModifierType.TYPE));
    })

    it('test change ptr', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const stmt1 = file?.getClassWithName('ChangePtrTest')?.getMethodWithName('callField')?.getCfg()?.getStmts()[1];
        assert.equal(stmt1?.toString(), 'ptrinvoke this.fieldA<@inferType/inferSample.ts: ChangePtrTest.%AM0$%instInit(number)>(111)');
        const stmt2 = file?.getClassWithName('ChangePtrTest')?.getMethodWithName('callField')?.getCfg()?.getStmts()[2];
        assert.equal(stmt2?.toString(), 'ptrinvoke this.fieldB<@inferType/inferSample.ts: ChangePtrTest.%AM1$%instInit(number)>(222)');
        const stmt3 = file?.getClassWithName('ChangePtrTest')?.getMethodWithName('callField')?.getCfg()?.getStmts()[5];
        assert.equal(stmt3?.toString(), 'ptrinvoke this.fieldC<@built-in/lib.es5.d.ts: Function.call(@built-in/lib.es5.d.ts: Function, any, any[])>(333)');
    })

    it('ArkUI extend function', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'ArktsExtend.ets');
        const file = scene.getFile(fileId);
        assert.isDefined(file);
        const printer = new ArkIRFilePrinter(file!);
        const s1 = printer.dump();
        const fileIR = `class %dflt {
  %dflt(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: %dflt
      return
  }

  %AM0(): void

  @Styles
  globalFancy1<T>(): T {
    label0:
      this = this: @inferType/ArktsExtend.ets: %dflt
      %0 = @etsSdk/api/@internal/component/ets/enums.d.ts: Color.[static]Pink
      %1 = instanceinvoke CommonInstance.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.width(Length)>(150)
      %2 = instanceinvoke %1.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.height(Length)>(100)
      instanceinvoke %2.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.backgroundColor(ResourceColor)>(%0)
      return
  }

  @Styles
  fancy<T>(): T {
    label0:
      this = this: @inferType/ArktsExtend.ets: %dflt
      instanceinvoke CommonInstance.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.width(Length)>(300)
      return
  }

  @Extend(Text)
  makeMeClick(onClick: @inferType/ArktsExtend.ets: %dflt.%AM0()): @etsSdk/api/@internal/component/ets/text.d.ts: TextAttribute {
    label0:
      onClick = parameter0: @inferType/ArktsExtend.ets: %dflt.%AM0()
      this = this: @inferType/ArktsExtend.ets: %dflt
      %0 = @etsSdk/api/@internal/component/ets/enums.d.ts: Color.[static]Blue
      %1 = instanceinvoke TextInstance.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.backgroundColor(ResourceColor)>(%0)
      instanceinvoke %1.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.onClick(@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.%AM1(@etsSdk/api/@internal/component/ets/common.d.ts: ClickEvent))>(onClick)
      return
  }

  @AnimatableExtend(Text)
  animatableWidth(width: number): @etsSdk/api/@internal/component/ets/text.d.ts: TextAttribute {
    label0:
      width = parameter0: number
      this = this: @inferType/ArktsExtend.ets: %dflt
      instanceinvoke TextInstance.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.width(Length)>(width)
      return
  }
}
typeliteral %AC0 {
  heightValue?: number
}
typeliteral %AC1 {
  label?: string
}
typeliteral %AC2 {
  textWidth?: number
}
@Entry
@Component
struct GlobalFancy {
  @State
  heightValue: number

  static %statInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: GlobalFancy
      return
  }

  constructor(value?: @inferType/ArktsExtend.ets: GlobalFancy, ##storage?: LocalStorage): @inferType/ArktsExtend.ets: GlobalFancy {
    label0:
      value = parameter0: @inferType/ArktsExtend.ets: %AC0
      ##storage = parameter1: LocalStorage
      this = this: @inferType/ArktsExtend.ets: GlobalFancy
      instanceinvoke this.<@inferType/ArktsExtend.ets: GlobalFancy.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: GlobalFancy
      this.<@inferType/ArktsExtend.ets: GlobalFancy.heightValue> = 100
      return
  }

  @Styles
  fancy<T>(): T {
    label0:
      this = this: @inferType/ArktsExtend.ets: GlobalFancy
      %0 = @etsSdk/api/@internal/component/ets/enums.d.ts: Color.[static]Gray
      %1 = this.<@inferType/ArktsExtend.ets: GlobalFancy.heightValue>
      %2 = instanceinvoke CommonInstance.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.width(Length)>(200)
      %3 = instanceinvoke %2.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.height(Length)>(%1)
      %4 = instanceinvoke %3.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.backgroundColor(ResourceColor)>(%0)
      instanceinvoke %4.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.onClick(@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.%AM1(@etsSdk/api/@internal/component/ets/common.d.ts: ClickEvent))>(%AM0$fancy)
      return
  }

  %AM0$fancy(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: GlobalFancy
      this.<@inferType/ArktsExtend.ets: GlobalFancy.heightValue> = 200
      return
  }

  build(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: GlobalFancy
      %0 = new @inferType/ArktsExtend.ets: %AC3$GlobalFancy-build
      %0 = instanceinvoke %0.<@inferType/ArktsExtend.ets: %AC3$GlobalFancy-build.constructor()>()
      %1 = staticinvoke <@etsSdk/api/@internal/component/ets/column.d.ts: ColumnInterface.create(@etsSdk/api/@internal/component/ets/column.d.ts: ColumnOptions)>(%0)
      %2 = staticinvoke <@etsSdk/api/@internal/component/ets/text.d.ts: TextInterface.create(string|Resource, @etsSdk/api/@internal/component/ets/text.d.ts: TextOptions)>('FancyA')
      staticinvoke <@%unk/%unk: Text.pop()>()
      %3 = instanceinvoke %2.<@inferType/ArktsExtend.ets: %dflt.globalFancy1()>()
      instanceinvoke %3.<@etsSdk/api/@internal/component/ets/text.d.ts: TextAttribute.fontSize(number|string|Resource)>(30)
      %4 = staticinvoke <@etsSdk/api/@internal/component/ets/text.d.ts: TextInterface.create(string|Resource, @etsSdk/api/@internal/component/ets/text.d.ts: TextOptions)>('FancyB')
      staticinvoke <@%unk/%unk: Text.pop()>()
      %5 = instanceinvoke %4.<@inferType/ArktsExtend.ets: GlobalFancy.fancy()>()
      instanceinvoke %5.<@etsSdk/api/@internal/component/ets/text.d.ts: TextAttribute.fontSize(number|string|Resource)>(30)
      staticinvoke <@%unk/%unk: Column.pop()>()
      instanceinvoke %1.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.width(Length)>('100%')
      return
  }
}
object %AC3$GlobalFancy-build {
  space: string|number

  constructor(): @inferType/ArktsExtend.ets: %AC3$GlobalFancy-build {
    label0:
      this = this: @inferType/ArktsExtend.ets: %AC3$GlobalFancy-build
      instanceinvoke this.<@inferType/ArktsExtend.ets: %AC3$GlobalFancy-build.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: %AC3$GlobalFancy-build
      this.<@etsSdk/api/@internal/component/ets/column.d.ts: ColumnOptions.space> = 10
      return
  }
}
@Entry
@Component
struct FancyUse {
  @State
  label: string

  static %statInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: FancyUse
      return
  }

  constructor(value?: @inferType/ArktsExtend.ets: FancyUse, ##storage?: LocalStorage): @inferType/ArktsExtend.ets: FancyUse {
    label0:
      value = parameter0: @inferType/ArktsExtend.ets: %AC1
      ##storage = parameter1: LocalStorage
      this = this: @inferType/ArktsExtend.ets: FancyUse
      instanceinvoke this.<@inferType/ArktsExtend.ets: FancyUse.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: FancyUse
      this.<@inferType/ArktsExtend.ets: FancyUse.label> = 'Hello World'
      return
  }

  onClickHandler(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: FancyUse
      this.<@inferType/ArktsExtend.ets: FancyUse.label> = 'Hello ArkUI'
      return
  }

  build(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: FancyUse
      %0 = new @inferType/ArktsExtend.ets: %AC4$FancyUse-build
      %0 = instanceinvoke %0.<@inferType/ArktsExtend.ets: %AC4$FancyUse-build.constructor()>()
      %1 = staticinvoke <@%unk/%unk: Row.create()>(%0)
      %2 = this.<@inferType/ArktsExtend.ets: FancyUse.label>
      %3 = instanceinvoke %2.<@built-in/lib.es5.d.ts: String.toString()>()
      %4 = staticinvoke <@etsSdk/api/@internal/component/ets/text.d.ts: TextInterface.create(string|Resource, @etsSdk/api/@internal/component/ets/text.d.ts: TextOptions)>(%3)
      staticinvoke <@%unk/%unk: Text.pop()>()
      %5 = instanceinvoke %4.<@inferType/ArktsExtend.ets: %dflt.makeMeClick(@inferType/ArktsExtend.ets: %dflt.%AM0())>(%AM0$build)
      instanceinvoke %5.<@inferType/ArktsExtend.ets: %dflt.fancy()>()
      staticinvoke <@%unk/%unk: Row.pop()>()
      return
  }

  %AM0$build(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: FancyUse
      instanceinvoke this.<@inferType/ArktsExtend.ets: FancyUse.onClickHandler()>()
      return
  }
}
object %AC4$FancyUse-build {
  space: number

  constructor(): @inferType/ArktsExtend.ets: %AC4$FancyUse-build {
    label0:
      this = this: @inferType/ArktsExtend.ets: %AC4$FancyUse-build
      instanceinvoke this.<@inferType/ArktsExtend.ets: %AC4$FancyUse-build.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: %AC4$FancyUse-build
      this.<@inferType/ArktsExtend.ets: %AC4$FancyUse-build.space> = 10
      return
  }
}
@Entry
@Component
struct AnimatablePropertyText {
  @State
  textWidth: number

  static %statInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: AnimatablePropertyText
      return
  }

  constructor(value?: @inferType/ArktsExtend.ets: AnimatablePropertyText, ##storage?: LocalStorage): @inferType/ArktsExtend.ets: AnimatablePropertyText {
    label0:
      value = parameter0: @inferType/ArktsExtend.ets: %AC2
      ##storage = parameter1: LocalStorage
      this = this: @inferType/ArktsExtend.ets: AnimatablePropertyText
      instanceinvoke this.<@inferType/ArktsExtend.ets: AnimatablePropertyText.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: AnimatablePropertyText
      this.<@inferType/ArktsExtend.ets: AnimatablePropertyText.textWidth> = 80
      return
  }

  build(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: AnimatablePropertyText
      %0 = staticinvoke <@etsSdk/api/@internal/component/ets/column.d.ts: ColumnInterface.create(@etsSdk/api/@internal/component/ets/column.d.ts: ColumnOptions)>()
      %1 = new @inferType/ArktsExtend.ets: %AC5$AnimatablePropertyText-build
      %1 = instanceinvoke %1.<@inferType/ArktsExtend.ets: %AC5$AnimatablePropertyText-build.constructor()>()
      %2 = this.<@inferType/ArktsExtend.ets: AnimatablePropertyText.textWidth>
      %3 = staticinvoke <@etsSdk/api/@internal/component/ets/text.d.ts: TextInterface.create(string|Resource, @etsSdk/api/@internal/component/ets/text.d.ts: TextOptions)>('AnimatableProperty')
      staticinvoke <@%unk/%unk: Text.pop()>()
      %4 = instanceinvoke %3.<@inferType/ArktsExtend.ets: %dflt.animatableWidth(number)>(%2)
      instanceinvoke %4.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.animation(@etsSdk/api/@internal/component/ets/common.d.ts: AnimateParam)>(%1)
      staticinvoke <@%unk/%unk: Column.pop()>()
      %5 = instanceinvoke %0.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.width(Length)>('100%')
      instanceinvoke %5.<@etsSdk/api/@internal/component/ets/common.d.ts: CommonMethod.padding(Padding|Length|LocalizedPadding)>(10)
      return
  }
}
object %AC5$AnimatablePropertyText-build {
  duration: number
  curve: @etsSdk/api/@internal/component/ets/enums.d.ts: Curve|string|@etsSdk/api/@internal/component/ets/common.d.ts: ICurve|@etsSdk/api/@internal/component/ets/enums.d.ts: Curve.[static]Ease

  constructor(): @inferType/ArktsExtend.ets: %AC5$AnimatablePropertyText-build {
    label0:
      this = this: @inferType/ArktsExtend.ets: %AC5$AnimatablePropertyText-build
      instanceinvoke this.<@inferType/ArktsExtend.ets: %AC5$AnimatablePropertyText-build.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @inferType/ArktsExtend.ets: %AC5$AnimatablePropertyText-build
      this.<@etsSdk/api/@internal/component/ets/common.d.ts: AnimateParam.duration> = 2000
      %0 = @etsSdk/api/@internal/component/ets/enums.d.ts: Curve.[static]Ease
      this.<@etsSdk/api/@internal/component/ets/common.d.ts: AnimateParam.curve> = %0
      return
  }
}
`;
        assert.equal(s1, fileIR);
    });

    it('infer to getter setter', () => {
        const expectMethodIR = `test(): void {
  label0:
    this = this: @inferType/inferSample.ts: AA
    str = staticinvoke <@inferType/inferSample.ts: AA.[static]Get-Str()>()
    staticinvoke <@inferType/inferSample.ts: AA.[static]Set-Str(string)>(str)
    %0 = new @inferType/inferSample.ts: AA
    %0 = instanceinvoke %0.<@inferType/inferSample.ts: AA.constructor()>()
    aa = %0
    n = instanceinvoke aa.<@inferType/inferSample.ts: AA.Get-count()>()
    instanceinvoke aa.<@inferType/inferSample.ts: AA.Set-count(number)>(n)
    return
}
`;
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const method = scene.getFile(fileId)?.getClassWithName('AA')?.getMethodWithName('test');
        if (method) {
            const printer = new ArkIRMethodPrinter(method, '');
            const s1 = printer.dump();
            assert.equal(s1, expectMethodIR);
        } else {
            assert.fail('not found test method');
        }
    });
})

describe("for Test without sdk", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/cfg/loop"));
    config.getOptions().enableBuiltIn = false;
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('for case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getCfg()?.getStmts()?.[10].toString(), '%4 = %2.<@ES2015/BuiltinClass: IteratorResult.value>')
    })

    it('while case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testWhile')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getCfg()?.getStmts()?.[10].toString(), '%4 = %2.<@ES2015/BuiltinClass: IteratorResult.value>')
    })

})

describe("for Test with sdk", () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, "../resources/cfg/loop"));
    config.getOptions().enableBuiltIn = true;
    let scene: Scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    it('for case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testFor')
            ?.getCfg()?.getStmts()?.[10].toString(), '%4 = %2.<@built-in/lib.es2015.iterable.d.ts: IteratorYieldResult.value>')
    })

    it('while case', () => {
        const fileId = new FileSignature(scene.getProjectName(), 'LoopSample.ts');
        const file = scene.getFile(fileId);
        const item = file?.getDefaultClass()?.getMethodWithName('testWhile')
            ?.getBody()?.getLocals().get('item');
        assert.isDefined(item);
        if (item) {
            assert.equal(item.getType().toString(), 'number');
        }
        assert.equal(file?.getDefaultClass()?.getMethodWithName('testWhile')
            ?.getCfg()?.getStmts()?.[11].toString(), 'item = next.<@built-in/lib.es2015.iterable.d.ts: IteratorYieldResult.value>')
    })
})

describe("Test built in version", () => {

    it('version 2017 case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/dependency/exampleProject/DependencyTest1');
        config.getOptions().enableBuiltIn = true;
        let scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        assert.isNull((scene.getSdkGlobal('Promise') as ArkClass).getMethodWithName('any'));
    })

    it('version 2021 case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir('./tests/resources/dependency/exampleProject/DependencyTest');
        config.getOptions().enableBuiltIn = true;
        let scene: Scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        assert.isNotNull((scene.getSdkGlobal('Promise') as ArkClass).getMethodWithName('any'));
    })
})