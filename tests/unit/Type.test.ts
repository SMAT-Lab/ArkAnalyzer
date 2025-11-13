/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
    ArkInstanceInvokeExpr,
    ArkInvokeStmt,
    ArkMethod,
    ArkStaticFieldRef,
    ArkStaticInvokeExpr,
    ArrayType,
    BigIntType,
    ClassType,
    FileSignature,
    FunctionType,
    IntersectionType,
    Local,
    NumberType,
    Scene,
    SceneConfig,
    SourceClassPrinter,
    SourceFilePrinter,
    SourceMethodPrinter,
    Stmt,
    TupleType,
    UnionType,
    UnknownType,
} from '../../src';
import {
    AliasTypeMultiRef,
    AliasTypeOfBoolean,
    AliasTypeOfClassA,
    AliasTypeOfClassB,
    AliasTypeOfFunctionType,
    AliasTypeOfGenericArrayType,
    AliasTypeOfGenericArrayTypeWithNumber,
    AliasTypeOfGenericClassType,
    AliasTypeOfGenericFunctionType,
    AliasTypeOfGenericObjectType,
    AliasTypeOfGenericObjectWithBooleanNumber,
    AliasTypeOfGenericTupleType,
    AliasTypeOfGenericTupleTypeWithNumber,
    AliasTypeOfGenericType,
    AliasTypeOfGenericTypeWithNumber,
    AliasTypeOfLiteralType,
    AliasTypeOfMultiQualifier,
    AliasTypeOfMultiTypeQuery,
    AliasTypeOfNumberA,
    AliasTypeOfObjectA,
    AliasTypeOfQueryOfLiteralType,
    AliasTypeOfSingleTypeQuery,
    AliasTypeOfString,
    AliasTypeOfUnionType,
    AliasTypeOfWholeExports,
    AliasTypeRef,
    IRBigIntType,
    SourceAliasTypeWithClassType,
    SourceAliasTypeWithFunctionType,
    SourceAliasTypeWithGenericType,
    SourceAliasTypeWithImport,
    SourceAliasTypeWithLiteralType,
    SourceAliasTypeWithReference,
    SourceAliasTypeWithTypeQuery,
    SourceAliasTypeWithUnionType,
    SourceAllKeyofObjectClassWithTypeOperator,
    SourceBasicKeyofClassWithTypeOperator,
    SourceBasicReadonlyClassWithTypeOperator,
    SourceBigIntType,
    SourceIntersectionTypeForClass,
    SourceIntersectionTypeForDefaultMethod,
    SourceIntersectionTypeForFunction,
    SourceIROfObjectType,
    SourceKeyofWithGenericClassWithTypeOperator,
    SourceReadonlyOfGenericTypeClassWithTypeOperator,
    SourceReadonlyOfReferenceTypeClassWithTypeOperator,
    SourceSimpleAliasType,
} from '../resources/type/expectedIR';
import { KeyofTypeExpr, TypeQueryExpr } from '../../src/core/base/TypeExpr';
import { BigIntConstant } from '../../src/core/base/Constant';
import { ArkIRFilePrinter } from '../../src/save/arkir/ArkIRFilePrinter';

function buildScene(): Scene {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../resources/type'));
    config.getSdksObj().push({ moduleName: '', name: 'es2015', path: path.join(__dirname, '../resources/Sdk') });
    let projectScene: Scene = new Scene();
    projectScene.buildSceneFromProjectDir(config);
    projectScene.inferTypes();
    return projectScene;
}

function compareAliasType(aliasType: AliasType, expectIR: any): void {
    const originalType = aliasType.getOriginalType();
    assert.equal(originalType.toString(), expectIR.originalType);
    if (originalType instanceof FunctionType) {
        assert.equal(originalType.getRealGenericTypes()?.toString(), expectIR.functionTypeRealGenericTypes);
    }
    assert.equal(aliasType.getName(), expectIR.name);
    assert.equal(aliasType.getModifiers(), expectIR.modifiers);
    assert.equal(aliasType.getSignature().toString(), expectIR.signature);
    assert.equal(aliasType.getGenericTypes()?.toString(), expectIR.genericTypes);
    assert.equal(aliasType.getRealGenericTypes()?.toString(), expectIR.rawGenericTypes);
}

function compareTypeAliasStmt(stmt: Stmt, expectIR: any): void {
    if (expectIR.instanceof !== undefined) {
        assert.isTrue(stmt instanceof expectIR.instanceof);
    }

    assert.equal(stmt.getOriginPositionInfo().getLineNo(), expectIR.line);
    assert.equal(stmt.getOriginPositionInfo().getColNo(), expectIR.column);

    if (expectIR.operandColumns === undefined) {
        return;
    }
    for (let j = 0; j < expectIR.operandColumns.length; j++) {
        const expectedOpPosition = expectIR.operandColumns[j];
        const opPosition = stmt.getOperandOriginalPosition(j);
        assert.isNotNull(opPosition);
        const cols = [opPosition!.getFirstCol(), opPosition!.getLastCol()];
        assert.equal(cols[0], expectedOpPosition[0]);
        assert.equal(cols[1], expectedOpPosition[1]);
    }
}

function checkLocalWithBigIntType(name: string, method?: ArkMethod | null): void {
    const local = method?.getBody()?.getLocals().get(name);
    assert.isDefined(local);
    assert.isTrue(local!.getType() instanceof BigIntType);
}

function checkLocalWithNumberType(name: string, method?: ArkMethod | null): void {
    const local = method?.getBody()?.getLocals().get(name);
    assert.isDefined(local);
    assert.isTrue(local!.getType() instanceof NumberType);
}

function checkLocalInitWithBigIntConstant(stmt: Stmt, expectValue: string): void {
    assert.isTrue(stmt instanceof ArkAssignStmt);
    const value = (stmt as ArkAssignStmt).getRightOp();
    assert.isTrue(value instanceof BigIntConstant);
    assert.isTrue(value.getType() instanceof BigIntType);
    assert.equal((value as BigIntConstant).getValue(), expectValue);
}

let projectScene = buildScene();
const fileId = new FileSignature(projectScene.getProjectName(), 'test.ts');
const defaultClass = projectScene.getFile(fileId)?.getDefaultClass();

describe('Special Test', () => {
    it('Special check for function isUnclearType', () => {
        const typeStr = '@type/exportExample.ts: A.B.C|null';
        const specialClass = projectScene.getFile(fileId)?.getClassWithName('SpecialForIsUnclearCheck');

        const fieldA = specialClass?.getFieldWithName('A');
        assert.isDefined(fieldA);
        assert.isNotNull(fieldA);
        assert.equal(fieldA!.getType().toString(), typeStr);
        const stmtA = specialClass?.getMethodWithName('testA')?.getBody()?.getCfg().getStmts()[1];
        assert.isDefined(stmtA);
        assert.equal((stmtA! as ArkAssignStmt).getLeftOp().getType().toString(), typeStr);
        assert.equal((stmtA! as ArkAssignStmt).getRightOp().getType().toString(), typeStr);

        const fieldB = specialClass?.getStaticFieldWithName('B');
        assert.isDefined(fieldB);
        assert.isNotNull(fieldB);
        assert.equal(fieldB!.getType().toString(), typeStr);
        const stmtB = specialClass?.getStaticMethodWithName('testB')?.getBody()?.getCfg().getStmts()[1];
        assert.isDefined(stmtB);
        assert.equal((stmtB! as ArkAssignStmt).getLeftOp().getType().toString(), typeStr);
        assert.equal((stmtB! as ArkAssignStmt).getRightOp().getType().toString(), typeStr);
    });
});

describe('Simple Alias Type Test', () => {
    const method = defaultClass?.getMethodWithName('simpleAliasType');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of boolean', () => {
        const alias = aliasTypeMap?.get('BooleanAliasType');
        assert.isDefined(alias);
        if (AliasTypeOfBoolean.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfBoolean.aliasType);
        }

        if (AliasTypeOfBoolean.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfBoolean.stmt);
        }
    });

    it('alias type of string', () => {
        const alias = aliasTypeMap?.get('StringAliasType');
        assert.isDefined(alias);
        if (AliasTypeOfString.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfString.aliasType);
        }

        if (AliasTypeOfString.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 3);
            compareTypeAliasStmt(stmts![2], AliasTypeOfString.stmt);
        }
    });

    it('alias type using in params', () => {
        const method = projectScene.getFile(fileId)?.getDefaultClass().getMethodWithName('%useAliasTypeInParam$simpleAliasType');
        assert.isDefined(method);
        assert.isNotNull(method);
        const params = method!.getSubSignature().getParameters();
        assert.equal(params.length, 1);
        const booleanAliasType = '@type/test.ts: %dflt.simpleAliasType()#BooleanAliasType';
        const stringAliasType = '@type/test.ts: %dflt.simpleAliasType()#StringAliasType';
        assert.equal(params[0].getType().toString(), `${booleanAliasType}[]|${stringAliasType}`);
    });

    it('type alias should not in locals', () => {
        const locals = method?.getBody()?.getLocals();
        assert.isDefined(locals);
        assert.equal(locals!.size, 1);
    });
});

describe('Alias Type With Import Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithImport');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of exported class', () => {
        const alias = aliasTypeMap?.get('ClassAType');
        assert.isDefined(alias);
        if (AliasTypeOfClassA.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfClassA.aliasType);
        }

        if (AliasTypeOfClassA.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfClassA.stmt);
        }

        const importInfo = projectScene.getFile(fileId)?.getImportInfoBy('ClassA');
        assert.isUndefined(importInfo);
    });

    it('alias type of exported default namespace', () => {
        const locals = defaultClass?.getMethodWithName('aliasTypeWithImportDefault')?.getBody()?.getLocals();
        assert.isTrue(locals?.get('pix')?.getType() instanceof AliasType);
        assert.equal((locals?.get('pix')?.getType() as AliasType).getOriginalType().toString(), '@es2015/api/@internal/component/ets/@ohos.multimedia.image.d.ts: image.PixelMap');
        assert.equal(locals?.get('b')?.getType().toString(), '@es2015/api/@internal/component/ets/@ohos.multimedia.image.d.ts: image.ImageInfo');
    });

    it('alias type of default exported class', () => {
        const alias = aliasTypeMap?.get('ClassBType');
        assert.isDefined(alias);
        if (AliasTypeOfClassB.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfClassB.aliasType);
        }

        if (AliasTypeOfClassB.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 3);
            compareTypeAliasStmt(stmts![2], AliasTypeOfClassB.stmt);
        }

        let importInfo = projectScene.getFile(fileId)?.getImportInfoBy('ClassB');
        assert.isUndefined(importInfo);

        importInfo = projectScene.getFile(fileId)?.getImportInfoBy('default');
        assert.isUndefined(importInfo);
    });

    it('alias type of exported number type', () => {
        const alias = aliasTypeMap?.get('NumberAType');
        assert.isDefined(alias);
        if (AliasTypeOfNumberA.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfNumberA.aliasType);
        }

        if (AliasTypeOfNumberA.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 4);
            compareTypeAliasStmt(stmts![3], AliasTypeOfNumberA.stmt);
        }

        const importInfo = projectScene.getFile(fileId)?.getImportInfoBy('numberA');
        assert.isDefined(importInfo);
        assert.equal(importInfo!.getOriginTsPosition().getLineNo(), 16);
    });

    it('alias type of multiple qualifier', () => {
        const alias = aliasTypeMap?.get('MultiQualifierType');
        assert.isDefined(alias);
        if (AliasTypeOfMultiQualifier.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfMultiQualifier.aliasType);
        }

        if (AliasTypeOfMultiQualifier.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 5);
            compareTypeAliasStmt(stmts![4], AliasTypeOfMultiQualifier.stmt);
        }

        const importInfo = projectScene.getFile(fileId)?.getImportInfoBy('A.B.C');
        assert.isUndefined(importInfo);
    });

    it('alias type of object literal type', () => {
        const alias = aliasTypeMap?.get('ObjectAType');
        assert.isDefined(alias);
        if (AliasTypeOfObjectA.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfObjectA.aliasType);
        }

        if (AliasTypeOfObjectA.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 6);
            compareTypeAliasStmt(stmts![5], AliasTypeOfObjectA.stmt);
        }

        const importInfo = projectScene.getFile(fileId)?.getImportInfoBy('objectA');
        assert.isDefined(importInfo);
        assert.equal(importInfo!.getOriginTsPosition().getLineNo(), 16);
    });

    it('alias type of whole exports type', () => {
        const alias = aliasTypeMap?.get('WholeExportsType');
        assert.isDefined(alias);
        if (AliasTypeOfWholeExports.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfWholeExports.aliasType);
        }

        if (AliasTypeOfWholeExports.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 7);
            compareTypeAliasStmt(stmts![6], AliasTypeOfWholeExports.stmt);
        }
    });

    it('alias type using in body', () => {
        const method = projectScene.getFile(fileId)?.getDefaultClass().getMethodWithName('%useAliasTypeInBody$aliasTypeWithImport');
        assert.isDefined(method);
        assert.isNotNull(method);
        const localA = method!.getBody()?.getLocals().get('a');
        assert.isDefined(localA);
        assert.equal(localA!.getType().toString(), '@type/test.ts: %dflt.aliasTypeWithImport()#NumberAType[]');
    });

    it('type alias should not in locals', () => {
        const locals = method?.getBody()?.getLocals();

        const classAType = locals?.get('ClassAType');
        assert.isUndefined(classAType);

        const classBType = locals?.get('ClassBType');
        assert.isUndefined(classBType);

        const numberAType = locals?.get('NumberAType');
        assert.isUndefined(numberAType);

        const typeOfType = locals?.get('typeOfType');
        assert.isUndefined(typeOfType);

        const multiQualifierType = locals?.get('MultiQualifierType');
        assert.isUndefined(multiQualifierType);

        const objectAType = locals?.get('ObjectAType');
        assert.isUndefined(objectAType);

        const wholeExportsType = locals?.get('WholeExportsType');
        assert.isUndefined(wholeExportsType);
    });
});

describe('Alias Type With Type Query Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithTypeQuery');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of single qualifier', () => {
        const alias = aliasTypeMap?.get('SingleTypeQuery');
        assert.isDefined(alias);
        if (AliasTypeOfSingleTypeQuery.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfSingleTypeQuery.aliasType);
        }

        if (AliasTypeOfSingleTypeQuery.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfSingleTypeQuery.stmt);
        }
    });

    it('alias type of multiple qualifiers', () => {
        const alias = aliasTypeMap?.get('MultiTypeQuery');
        assert.isDefined(alias);
        if (AliasTypeOfMultiTypeQuery.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfMultiTypeQuery.aliasType);
        }

        if (AliasTypeOfMultiTypeQuery.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 3);
            compareTypeAliasStmt(stmts![2], AliasTypeOfMultiTypeQuery.stmt);
        }
    });

    it('type alias should not in locals', () => {
        const locals = method?.getBody()?.getLocals();

        const singleTypeQuery = locals?.get('SingleTypeQuery');
        assert.isUndefined(singleTypeQuery);

        const multiTypeQuery = locals?.get('MultiTypeQuery');
        assert.isUndefined(multiTypeQuery);
    });
});

describe('Alias Type With Reference Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithReference');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type', () => {
        const alias = aliasTypeMap?.get('ReferType');
        assert.isDefined(alias);
        if (AliasTypeRef.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeRef.aliasType);
        }

        if (AliasTypeRef.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeRef.stmt);
        }
    });

    it('alias type of multiple reference', () => {
        const alias = aliasTypeMap?.get('MultiReferType');
        assert.isDefined(alias);
        if (AliasTypeMultiRef.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeMultiRef.aliasType);
        }

        if (AliasTypeMultiRef.stmts !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 3);
            compareTypeAliasStmt(stmts![2], AliasTypeMultiRef.stmts);
        }
    });

    it('type alias should not in locals', () => {
        const locals = method?.getBody()?.getLocals();

        const referType = locals?.get('ReferType');
        assert.isUndefined(referType);

        const multiReferType = locals?.get('MultiReferType');
        assert.isUndefined(multiReferType);
    });
});

describe('Alias Type With Literal Type Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithLiteralType');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of literalType', () => {
        const alias = aliasTypeMap?.get('ABC');
        assert.isDefined(alias);
        if (AliasTypeOfLiteralType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfLiteralType.aliasType);
        }

        if (AliasTypeOfLiteralType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfLiteralType.stmt);
        }
    });

    it('alias type of type query of literalType', () => {
        const alias = aliasTypeMap?.get('XYZ');
        assert.isDefined(alias);
        if (AliasTypeOfQueryOfLiteralType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfQueryOfLiteralType.aliasType);
        }

        if (AliasTypeOfQueryOfLiteralType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 4);
            compareTypeAliasStmt(stmts![3], AliasTypeOfQueryOfLiteralType.stmt);
        }
    });

    it('type alias should not in locals', () => {
        const locals = method?.getBody()?.getLocals();
        assert.isDefined(locals);
        assert.equal(locals!.size, 2);

        const localABC = locals?.get('ABC');
        assert.isUndefined(localABC);

        const localXYZ = locals?.get('XYZ');
        assert.isUndefined(localXYZ);
    });
});

describe('Alias Type With Function Type Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithFunctionType');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of FunctionType', () => {
        const alias = aliasTypeMap?.get('FunctionAliasType');
        assert.isDefined(alias);
        if (AliasTypeOfFunctionType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfFunctionType.aliasType);
        }

        if (AliasTypeOfFunctionType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfFunctionType.stmt);
        }
    });

    it('alias type of GenericFunctionType', () => {
        const alias = aliasTypeMap?.get('NumberGenericFunction');
        assert.isDefined(alias);
        if (AliasTypeOfGenericFunctionType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericFunctionType.aliasType);
        }

        if (AliasTypeOfGenericFunctionType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 3);
            compareTypeAliasStmt(stmts![2], AliasTypeOfGenericFunctionType.stmt);
        }
    });
});

describe('Alias Type With Union Type Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithUnionType');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of UnionType', () => {
        const alias = aliasTypeMap?.get('UnionAliasType');
        assert.isDefined(alias);
        if (AliasTypeOfUnionType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfUnionType.aliasType);
        }

        if (AliasTypeOfUnionType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfUnionType.stmt);
        }
    });
});

describe('Alias Type With Generic Type Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithGenericType');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of GenericType', () => {
        const alias = aliasTypeMap?.get('Generic');
        assert.isDefined(alias);
        if (AliasTypeOfGenericType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericType.aliasType);
        }

        if (AliasTypeOfGenericType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfGenericType.stmt);
        }
    });

    it('alias type of GenericTypeWithNumber', () => {
        const alias = aliasTypeMap?.get('GenericNumber');
        assert.isDefined(alias);
        if (AliasTypeOfGenericTypeWithNumber.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericTypeWithNumber.aliasType);
        }

        if (AliasTypeOfGenericTypeWithNumber.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 3);
            compareTypeAliasStmt(stmts![2], AliasTypeOfGenericTypeWithNumber.stmt);
        }

        assert.equal((alias![0].getOriginalType() as AliasType).getOriginalType().toString(), 'number');
    });

    it('alias type of GenericArrayType', () => {
        const alias = aliasTypeMap?.get('GenericArray');
        assert.isDefined(alias);
        if (AliasTypeOfGenericArrayType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericArrayType.aliasType);
        }

        if (AliasTypeOfGenericArrayType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 4);
            compareTypeAliasStmt(stmts![3], AliasTypeOfGenericArrayType.stmt);
        }
    });

    it('alias type of GenericArrayTypeWithNumber', () => {
        const alias = aliasTypeMap?.get('GenericArrayNumber');
        assert.isDefined(alias);
        if (AliasTypeOfGenericArrayTypeWithNumber.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericArrayTypeWithNumber.aliasType);
        }

        if (AliasTypeOfGenericArrayTypeWithNumber.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 5);
            compareTypeAliasStmt(stmts![4], AliasTypeOfGenericArrayTypeWithNumber.stmt);
        }

        assert.equal((alias![0].getOriginalType() as AliasType).getOriginalType().toString(), 'number[]');
    });

    it('alias type of GenericTupleType', () => {
        const alias = aliasTypeMap?.get('GenericTuple');
        assert.isDefined(alias);
        if (AliasTypeOfGenericTupleType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericTupleType.aliasType);
        }

        if (AliasTypeOfGenericTupleType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 6);
            compareTypeAliasStmt(stmts![5], AliasTypeOfGenericTupleType.stmt);
        }
    });

    it('alias type of GenericTupleTypeWithStringNumber', () => {
        const alias = aliasTypeMap?.get('GenericTupleStringNumber');
        assert.isDefined(alias);
        if (AliasTypeOfGenericTupleTypeWithNumber.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericTupleTypeWithNumber.aliasType);
        }

        if (AliasTypeOfGenericTupleTypeWithNumber.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 7);
            compareTypeAliasStmt(stmts![6], AliasTypeOfGenericTupleTypeWithNumber.stmt);
        }

        assert.equal((alias![0].getOriginalType() as AliasType).getOriginalType().toString(), '[string, number]');
    });

    it('alias type of GenericObjectType', () => {
        const alias = aliasTypeMap?.get('GenericObject');
        assert.isDefined(alias);
        if (AliasTypeOfGenericObjectType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericObjectType.aliasType);
        }

        if (AliasTypeOfGenericObjectType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 8);
            compareTypeAliasStmt(stmts![7], AliasTypeOfGenericObjectType.stmt);
        }
    });

    it('alias type of GenericObjectTypeWithBooleanNumber', () => {
        const alias = aliasTypeMap?.get('GenericObjectBooleanNumber');
        assert.isDefined(alias);
        if (AliasTypeOfGenericObjectWithBooleanNumber.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericObjectWithBooleanNumber.aliasType);
        }

        if (AliasTypeOfGenericObjectWithBooleanNumber.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 9);
            compareTypeAliasStmt(stmts![8], AliasTypeOfGenericObjectWithBooleanNumber.stmt);
        }

        assert.equal((alias![0].getOriginalType() as AliasType).getOriginalType().toString(), '@type/test.ts: %AC0<boolean,number>');
    });

    it('alias type of Generic in return type', () => {
        const returnType = defaultClass?.getMethodWithName('intersectionTypeWithGeneric')?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), '@type/test.ts: %dflt.[static]%dflt()#ParamType<boolean>');
    });

    it('alias type of global type', () => {
        const alias = defaultClass?.getMethodWithName('globalType')?.getBody()?.getAliasTypeMap()?.get('GlobalTypeBoolean');
        assert.isDefined(alias);
    });
});

describe('Alias Type With Generic Class Test', () => {
    const method = defaultClass?.getMethodWithName('aliasTypeWithClassType');
    const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
    const stmts = method?.getBody()?.getCfg().getStmts();

    it('alias type of GenericClass', () => {
        const alias = aliasTypeMap?.get('StringClass');
        assert.isDefined(alias);
        if (AliasTypeOfGenericClassType.aliasType !== undefined) {
            compareAliasType(alias![0], AliasTypeOfGenericClassType.aliasType);
        }

        if (AliasTypeOfGenericClassType.stmt !== undefined) {
            assert.isDefined(stmts);
            assert.isAtLeast(stmts!.length, 2);
            compareTypeAliasStmt(stmts![1], AliasTypeOfGenericClassType.stmt);
        }
    });
});

describe('Intersection Type With Generic Test', () => {

    it('intersection type in Function', () => {
        const method = defaultClass?.getMethodWithName('intersectionTypeWithGeneric');
        const methodParamString = '@type/test.ts: ClassWithGeneric<string>&@type/test.ts: %dflt.[static]%dflt()#ParamType<number>';
        const methodSignatureString = `@type/test.ts: %dflt.intersectionTypeWithGeneric(${methodParamString})`;

        const param = method?.getSubSignature().getParameters()[0];
        assert.isDefined(param);
        assert.equal(param?.getType().toString(), methodParamString);

        const aliasTypeMap = method?.getBody()?.getAliasTypeMap();
        assert.isDefined(aliasTypeMap);
        assert.isNotNull(aliasTypeMap);
        const originalType1 = aliasTypeMap?.get('interType')![0].getOriginalType();
        assert.isDefined(originalType1);
        assert.equal(originalType1!.toString(), '@type/test.ts: ClassWithGeneric<string>&typeof @type/test.ts: %dflt.functionWithGeneric(T)');
        assert.equal(((originalType1 as IntersectionType).getTypes()[1] as TypeQueryExpr).getGenerateTypes()?.toString(), 'number');

        const local = method?.getBody()?.getLocals().get('interLocal');
        assert.isDefined(local);
        assert.equal(local!.getType().toString(), `${methodSignatureString}#Generic<string>&${methodSignatureString}#GenericArray<boolean>`);
    });

    it('intersection type in Class Field', () => {
        const fields = projectScene.getFile(fileId)?.getClassWithName('IntersectionClassWithGeneric')?.getFields();
        const fieldA = fields?.find(f => f.getName() === 'fieldA');
        assert.isDefined(fieldA);
        assert.equal(fieldA!.getType().toString(), '@type/test.ts: ClassWithGeneric<string>&@type/test.ts: %dflt.[static]%dflt()#ParamType<string>');
    });
});

describe('Intersection Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'intersectionType.ts');
    const defaultClass = projectScene.getFile(fileId)?.getDefaultClass();
    const method = defaultClass?.getDefaultArkMethod();

    const aliasTypeAStr = '@type/intersectionType.ts: %dflt.[static]%dflt()#A';
    const aliasTypeBStr = '@type/intersectionType.ts: %dflt.[static]%dflt()#B';
    const classCanEatStr = '@type/intersectionType.ts: CanEat';
    const classCanSleepStr = '@type/intersectionType.ts: CanSleep';

    it('case1: simple intersection', () => {
        const alias = method?.getBody()?.getAliasTypeMap()?.get('IntersectionType');
        assert.isDefined(alias);
        assert.equal(alias![0].getOriginalType().toString(), 'string&number&void');
    });

    it('case2: complicated intersection', () => {
        const alias = method?.getBody()?.getAliasTypeMap()?.get('ComplicatedType');
        assert.isDefined(alias);
        assert.equal(alias![0].getOriginalType().toString(), 'string|((number&any)&(string|void))');
    });

    it('case3: interface intersection', () => {
        const alias = method?.getBody()?.getAliasTypeMap()?.get('IC');
        assert.isDefined(alias);
        assert.equal(alias![0].getOriginalType().toString(), '@type/intersectionType.ts: IA&@type/intersectionType.ts: IB');
    });

    it('case4: alias type intersection', () => {
        const alias = method?.getBody()?.getAliasTypeMap()?.get('C');
        assert.isDefined(alias);
        assert.equal(alias![0].getOriginalType().toString(), `${aliasTypeAStr}&${aliasTypeBStr}`);
    });

    it('case5: alias type and anonymous class intersection', () => {
        const alias = method?.getBody()?.getAliasTypeMap()?.get('Employee');
        assert.isDefined(alias);
        assert.equal(alias![0].getOriginalType().toString(), '@type/intersectionType.ts: %dflt.[static]%dflt()#Person&@type/intersectionType.ts: %AC3');
    });

    it('case6: class intersection', () => {
        const alias = method?.getBody()?.getAliasTypeMap()?.get('CanEatAndSleep');
        assert.isDefined(alias);
        assert.equal(alias![0].getOriginalType().toString(), `${classCanEatStr}&${classCanSleepStr}`);
    });

    it('case7: variable declaration with type intersection', () => {
        const local = method?.getBody()?.getLocals()?.get('student');
        assert.isDefined(local);
        assert.equal(local!.getType().toString(), `${aliasTypeAStr}&${aliasTypeBStr}`);
    });

    it('case8: method params with class intersection', () => {
        const params = defaultClass?.getMethodWithName('animal')?.getSubSignature().getParameters();
        assert.isDefined(params);
        assert.equal(params![0].getType().toString(), `${classCanEatStr}&${classCanSleepStr}`);
    });

    it('case9: method return type with type intersection', () => {
        const returnType = defaultClass?.getMethodWithName('animal')?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `${aliasTypeAStr}&${aliasTypeBStr}`);
    });

    it('case10: class field with class intersection', () => {
        const fields = projectScene.getFile(fileId)?.getClassWithName('Inter')?.getFields();
        assert.isDefined(fields);
        assert.equal(fields![1].getType().toString(), 'string&number');
        assert.equal(fields![2].getType().toString(), '@type/intersectionType.ts: %dflt.[static]%dflt()#A&@type/intersectionType.ts: %dflt.[static]%dflt()#B');
        assert.equal(fields![0].getType().toString(), '@type/intersectionType.ts: %dflt.[static]%dflt()#Employee&(number|boolean)');
        assert.equal(((fields![0].getType() as IntersectionType).getTypes()[0] as AliasType).getOriginalType().toString(), '@type/intersectionType.ts: %dflt.[static]%dflt()#Person&@type/intersectionType.ts: %AC3');
    });
});

describe('Readonly Type With Basic Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'typeOperator.ts');
    const basicClass = projectScene.getFile(fileId)?.getClassWithName('BasicReadonly');

    it('class field with readonly', () => {
        const field = basicClass?.getFieldWithName('fieldA');
        assert.isDefined(field);
        assert.equal(field!.getType().toString(), 'readonly string[]');
        assert.equal((field!.getType() as ArrayType).getReadonlyFlag(), true);
    });

    it('method param and return type with readonly', () => {
        const method = basicClass?.getMethodWithName('readonlyVariable');
        const param = method?.getParameters()[0];
        assert.isDefined(param);
        assert.equal(param!.getType().toString(), 'readonly [number, string]');
        assert.equal((param!.getType() as TupleType).getReadonlyFlag(), true);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), 'readonly boolean[]');
        assert.equal((returnType as TupleType).getReadonlyFlag(), true);
    });

    it('variable with readonly', () => {
        const method = basicClass?.getMethodWithName('readonlyVariable');

        const tupleLocal = method?.getBody()?.getLocals().get('readonlyTupleLocal');
        assert.isDefined(tupleLocal);
        assert.equal(tupleLocal!.getType().toString(), 'readonly [number, string]');
        assert.equal((tupleLocal!.getType() as TupleType).getReadonlyFlag(), true);

        const arrayLocal = method?.getBody()?.getLocals().get('readonlyArrayLocal');
        assert.isDefined(arrayLocal);
        assert.equal(arrayLocal!.getType().toString(), 'readonly number[]');
        assert.equal((arrayLocal!.getType() as ArrayType).getReadonlyFlag(), true);

        const unionLocal = method?.getBody()?.getLocals().get('readonlyUnionLocal');
        assert.isDefined(unionLocal);
        assert.equal(unionLocal!.getType().toString(), 'readonly number[]|readonly [number, string]');
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), true);
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);

        const intersectionLocal = method?.getBody()?.getLocals().get('readonlyIntersectionLocal');
        assert.isDefined(intersectionLocal);
        assert.equal(intersectionLocal!.getType().toString(), 'readonly number[]&readonly [number, string]');
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[0] as ArrayType).getReadonlyFlag(), true);
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);
    });

    it('alias type with readonly', () => {
        const aliases = basicClass?.getMethodWithName('readonlyAliasType')?.getBody()?.getAliasTypeMap();
        const aliasA = aliases?.get('A');
        const aliasB = aliases?.get('B');
        const aliasC = aliases?.get('C');
        const aliasD = aliases?.get('D');
        assert.isDefined(aliasA);
        assert.equal(aliasA![0].getOriginalType().toString(), 'readonly string[]');
        assert.equal((aliasA![0].getOriginalType() as ArrayType).getReadonlyFlag(), true);

        assert.isDefined(aliasB);
        assert.equal(aliasB![0].getOriginalType().toString(), 'readonly string[]|readonly [number, string]');
        assert.equal(((aliasB![0].getOriginalType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), true);
        assert.equal(((aliasB![0].getOriginalType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);

        assert.isDefined(aliasC);
        assert.equal(aliasC![0].getOriginalType().toString(), 'readonly string[]&readonly [number, string]');
        assert.equal(((aliasC![0].getOriginalType() as IntersectionType).getTypes()[0] as ArrayType).getReadonlyFlag(), true);
        assert.equal(((aliasC![0].getOriginalType() as IntersectionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);

        assert.isDefined(aliasD);
        assert.equal(aliasD![0].getOriginalType().toString(), 'readonly (string&number)[]&readonly (string|number)[]');
        assert.equal(((aliasD![0].getOriginalType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), true);
        assert.equal(((aliasD![0].getOriginalType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);
    });

    it('without readonly', () => {
        const field = basicClass?.getFieldWithName('fieldB');
        assert.isDefined(field);
        assert.equal(field!.getType().toString(), 'boolean[]');
        assert.equal((field!.getType() as ArrayType).getReadonlyFlag(), undefined);

        const variableMethdod = basicClass?.getMethodWithName('readonlyVariable');
        const aliasMethdod = basicClass?.getMethodWithName('readonlyAliasType');

        const param = aliasMethdod?.getParameters()[0];
        assert.isDefined(param);
        assert.equal(param!.getType().toString(), '[number, string]');
        assert.equal((param!.getType() as TupleType).getReadonlyFlag(), undefined);

        const returnType = aliasMethdod?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), 'string[]');
        assert.equal((returnType as TupleType).getReadonlyFlag(), undefined);

        const tupleLocal = variableMethdod?.getBody()?.getLocals().get('tupleLocal');
        assert.isDefined(tupleLocal);
        assert.equal(tupleLocal!.getType().toString(), '[number, string]');
        assert.equal((tupleLocal!.getType() as TupleType).getReadonlyFlag(), undefined);

        const arrayLocal = variableMethdod?.getBody()?.getLocals().get('arrayLocal');
        assert.isDefined(arrayLocal);
        assert.equal(arrayLocal!.getType().toString(), 'number[]');
        assert.equal((arrayLocal!.getType() as ArrayType).getReadonlyFlag(), undefined);

        const unionLocal = variableMethdod?.getBody()?.getLocals().get('unionLocal');
        assert.isDefined(unionLocal);
        assert.equal(unionLocal!.getType().toString(), 'number[]|[number, string]');
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), undefined);

        const intersectionLocal = variableMethdod?.getBody()?.getLocals().get('intersectionLocal');
        assert.isDefined(intersectionLocal);
        assert.equal(intersectionLocal!.getType().toString(), 'number[]&[number, string]');
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[1] as TupleType).getReadonlyFlag(), undefined);

        const aliases = aliasMethdod?.getBody()?.getAliasTypeMap();
        const aliasE = aliases?.get('E');
        const aliasF = aliases?.get('F');
        const aliasG = aliases?.get('G');
        assert.isDefined(aliasE);
        assert.equal(aliasE![0].getOriginalType().toString(), 'string[]');
        assert.equal((aliasE![0].getOriginalType() as ArrayType).getReadonlyFlag(), undefined);

        assert.isDefined(aliasF);
        assert.equal(aliasF![0].getOriginalType().toString(), 'string[]|[number, string]');
        assert.equal(((aliasF![0].getOriginalType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((aliasF![0].getOriginalType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), undefined);

        assert.isDefined(aliasG);
        assert.equal(aliasG![0].getOriginalType().toString(), 'string[]&[number, string]');
        assert.equal(((aliasG![0].getOriginalType() as IntersectionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((aliasG![0].getOriginalType() as IntersectionType).getTypes()[1] as TupleType).getReadonlyFlag(), undefined);
    });
});

describe('Readonly Type With Reference Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'typeOperator.ts');
    const referenceClass = projectScene.getFile(fileId)?.getClassWithName('ReadonlyOfReferenceType');
    const aliasAStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#A';

    it('class field with readonly', () => {
        const fieldA = referenceClass?.getFieldWithName('fieldA');
        assert.isDefined(fieldA);
        assert.equal(fieldA!.getType().toString(), `readonly ${aliasAStr}[]`);
        assert.equal((fieldA!.getType() as ArrayType).getReadonlyFlag(), true);

        const fieldB = referenceClass?.getFieldWithName('fieldB');
        assert.isDefined(fieldB);
        assert.equal(fieldB!.getType().toString(), `readonly [${aliasAStr}, boolean]`);
        assert.equal((fieldB!.getType() as TupleType).getReadonlyFlag(), true);
    });

    it('method param and return type with readonly', () => {
        const method = referenceClass?.getMethodWithName('readonlyVariable');
        const param = method?.getParameters()[0];
        assert.isDefined(param);
        assert.equal(param!.getType().toString(), `readonly [${aliasAStr}, string]`);
        assert.equal((param!.getType() as TupleType).getReadonlyFlag(), true);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `readonly ${aliasAStr}[]`);
        assert.equal((returnType as TupleType).getReadonlyFlag(), true);
    });

    it('variable with readonly', () => {
        const method = referenceClass?.getMethodWithName('readonlyVariable');
        const aliasBStr = `@type/typeOperator.ts: ReadonlyOfReferenceType.readonlyVariable(readonly [${aliasAStr}, string])#B`;

        const tupleLocal = method?.getBody()?.getLocals().get('readonlyTupleLocal');
        assert.isDefined(tupleLocal);
        assert.equal(tupleLocal!.getType().toString(), `readonly [number, ${aliasBStr}]`);
        assert.equal((tupleLocal!.getType() as TupleType).getReadonlyFlag(), true);

        const arrayLocal = method?.getBody()?.getLocals().get('readonlyArrayLocal');
        assert.isDefined(arrayLocal);
        assert.equal(arrayLocal!.getType().toString(), `readonly ${aliasBStr}[]`);
        assert.equal((arrayLocal!.getType() as ArrayType).getReadonlyFlag(), true);

        const unionLocal = method?.getBody()?.getLocals().get('readonlyUnionLocal');
        assert.isDefined(unionLocal);
        assert.equal(unionLocal!.getType().toString(), `number[]|readonly ${aliasAStr}[]`);
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);

        const intersectionLocal = method?.getBody()?.getLocals().get('readonlyIntersectionLocal');
        assert.isDefined(intersectionLocal);
        assert.equal(intersectionLocal!.getType().toString(), `number[]&readonly ${aliasAStr}[]`);
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);
    });

    it('alias type with readonly', () => {
        const aliases = referenceClass?.getMethodWithName('readonlyVariable')?.getBody()?.getAliasTypeMap();
        const aliasB = aliases?.get('B');
        assert.isDefined(aliasB);
        assert.equal(aliasB![0].getOriginalType().toString(), `readonly ${aliasAStr}[]|string`);
        assert.equal(((aliasB![0].getOriginalType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), true);
    });
});

describe('Readonly Type With Generic Reference Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'typeOperator.ts');
    const referenceClass = projectScene.getFile(fileId)?.getClassWithName('ReadonlyOfGenericType');
    const aliasCBooleanStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#C<boolean>';
    const aliasCStringStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#C<string>';
    const aliasCNumberStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#C<number>';

    it('class field with readonly', () => {
        const fieldA = referenceClass?.getFieldWithName('fieldA');
        assert.isDefined(fieldA);
        assert.equal(fieldA!.getType().toString(), `readonly ${aliasCBooleanStr}[]`);
        assert.equal(((fieldA!.getType() as ArrayType).getBaseType() as AliasType).getRealGenericTypes()?.toString(), 'boolean');
        assert.equal((fieldA!.getType() as ArrayType).getReadonlyFlag(), true);

        const fieldB = referenceClass?.getFieldWithName('fieldB');
        assert.isDefined(fieldB);
        assert.equal(fieldB!.getType().toString(), `readonly [${aliasCBooleanStr}, boolean]`);
        assert.equal(((fieldB!.getType() as TupleType).getTypes()[0] as AliasType).getRealGenericTypes()?.toString(), 'boolean');
        assert.equal((fieldB!.getType() as TupleType).getReadonlyFlag(), true);
    });

    it('method param and return type with readonly', () => {
        const method = referenceClass?.getMethodWithName('readonlyVariable');
        const param = method?.getParameters()[0];
        assert.isDefined(param);
        assert.equal(param!.getType().toString(), `readonly [${aliasCStringStr}, string]`);
        assert.equal(((param!.getType() as TupleType).getTypes()[0] as AliasType).getRealGenericTypes()?.toString(), 'string');
        assert.equal((param!.getType() as TupleType).getReadonlyFlag(), true);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `readonly ${aliasCBooleanStr}[]`);
        assert.equal(((returnType as ArrayType).getBaseType() as AliasType).getRealGenericTypes()?.toString(), 'boolean');
        assert.equal((returnType as TupleType).getReadonlyFlag(), true);
    });

    it('variable with readonly', () => {
        const method = referenceClass?.getMethodWithName('readonlyVariable');
        const methodSignatureStr = `@type/typeOperator.ts: ReadonlyOfGenericType.readonlyVariable(readonly [${aliasCStringStr}, string])`;

        const tupleLocal = method?.getBody()?.getLocals().get('readonlyTupleLocal');
        assert.isDefined(tupleLocal);
        assert.equal(tupleLocal!.getType().toString(), `readonly [${methodSignatureStr}#D, string]`);
        const tuple0 = (tupleLocal!.getType() as TupleType).getTypes()[0];
        const tuple0Union0 = (((tuple0 as AliasType).getOriginalType() as UnionType).getTypes()[0] as ArrayType).getBaseType();
        assert.equal((tuple0Union0 as AliasType).getRealGenericTypes()?.toString(), 'number');
        assert.equal((tupleLocal!.getType() as TupleType).getReadonlyFlag(), true);

        const arrayLocal = method?.getBody()?.getLocals().get('readonlyArrayLocal');
        assert.isDefined(arrayLocal);
        assert.equal(arrayLocal!.getType().toString(), `readonly ${methodSignatureStr}#D[]`);
        assert.equal((arrayLocal!.getType() as ArrayType).getReadonlyFlag(), true);

        const unionLocal = method?.getBody()?.getLocals().get('readonlyUnionLocal');
        assert.isDefined(unionLocal);
        assert.equal(unionLocal!.getType().toString(), `number[]|readonly ${aliasCStringStr}[]`);
        const union1 = (unionLocal!.getType() as UnionType).getTypes()[1];
        assert.equal(((union1 as ArrayType).getBaseType() as AliasType).getRealGenericTypes()?.toString(), 'string');
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal(((unionLocal!.getType() as UnionType).getTypes()[1] as TupleType).getReadonlyFlag(), true);

        const intersectionLocal = method?.getBody()?.getLocals().get('readonlyIntersectionLocal');
        assert.isDefined(intersectionLocal);
        assert.equal(intersectionLocal!.getType().toString(), `number[]&readonly ${aliasCStringStr}[]`);
        const intersection1 = (intersectionLocal!.getType() as IntersectionType).getTypes()[1];
        assert.equal(((intersection1 as ArrayType).getBaseType() as AliasType).getRealGenericTypes()?.toString(), 'string');
        assert.equal(((intersectionLocal!.getType() as IntersectionType).getTypes()[0] as ArrayType).getReadonlyFlag(), undefined);
        assert.equal((intersection1 as ArrayType).getReadonlyFlag(), true);
    });

    it('alias type with readonly', () => {
        const aliases = referenceClass?.getMethodWithName('readonlyVariable')?.getBody()?.getAliasTypeMap();
        const aliasD = aliases?.get('D');
        assert.isDefined(aliasD);
        assert.equal(aliasD![0].getOriginalType().toString(), `readonly ${aliasCNumberStr}[]|string`);
        const union0 = (aliasD![0].getOriginalType() as UnionType).getTypes()[0];
        assert.equal(((union0 as ArrayType).getBaseType() as AliasType).getRealGenericTypes()?.toString(), `number`);
        assert.equal((union0 as ArrayType).getReadonlyFlag(), true);
    });
});

describe('Keyof Type With Basic Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'typeOperator.ts');
    const basicClass = projectScene.getFile(fileId)?.getClassWithName('BasicKeyof');
    const personTypeStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#PersonType';
    const personStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#PersonType';
    const thisReturnValueStr = 'this.<@type/typeOperator.ts: BasicKeyof.returnValue>';
    const thisAgeKeyStr = 'this.<@type/typeOperator.ts: BasicKeyof.ageKey>';

    it('keyof class field', () => {
        const fieldNameKey = basicClass?.getFieldWithName('nameKey');
        assert.isDefined(fieldNameKey);
        assert.equal(fieldNameKey!.getType().toString(), `keyof ${personTypeStr}`);
        const ageNameKey = basicClass?.getFieldWithName('ageKey');
        assert.isDefined(ageNameKey);
        assert.equal(ageNameKey!.getType().toString(), `keyof typeof ${personStr}`);
        const returnValueKey = basicClass?.getFieldWithName('returnValue');
        assert.isDefined(returnValueKey);
        assert.equal(returnValueKey!.getType().toString(), personTypeStr);
        assert.equal((returnValueKey!.getInitializer()[0] as ArkAssignStmt).getRightOp().getType().toString(), personTypeStr);
    });

    it('keyof object type', () => {
        const method = basicClass?.getMethodWithName('keyofObjectType');

        const param = method?.getParameters()[0];
        assert.isDefined(param);
        assert.equal(param!.getType().toString(), `keyof ${personTypeStr}`);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `keyof ${personTypeStr}[]`);

        const aliases = method?.getBody()?.getAliasTypeMap();
        const aliasPersonKeys = aliases?.get('PersonKeys');
        assert.isDefined(aliasPersonKeys);
        assert.equal(aliasPersonKeys![0].getOriginalType().toString(), `keyof ${personTypeStr}`);

        const p1Local = method?.getBody()?.getLocals().get('p1');
        assert.isDefined(p1Local);
        assert.equal(p1Local!.getType().toString(), `@type/typeOperator.ts: BasicKeyof.keyofObjectType(keyof ${personTypeStr})#PersonKeys`);
        const p2Local = method?.getBody()?.getLocals().get('p2');
        assert.isDefined(p2Local);
        assert.equal(p2Local!.getType().toString(), `keyof ${personTypeStr}`);
    });

    it('keyof with typeof of object value', () => {
        const method = basicClass?.getMethodWithName('keyofWithTypeof');

        const param1 = method?.getParameters()[0];
        assert.isDefined(param1);
        assert.equal((((param1!.getType() as KeyofTypeExpr).getOpType() as TypeQueryExpr).getOpValue() as Local).getType().toString(), personTypeStr);

        const param2 = method?.getParameters()[1];
        assert.isDefined(param2);
        assert.equal(param2!.getType().toString(), `keyof typeof ${thisAgeKeyStr}`);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `keyof typeof ${thisReturnValueStr}`);

        const aliases = method?.getBody()?.getAliasTypeMap();
        const aliasPersonKeys = aliases?.get('PersonKeys');
        assert.isDefined(aliasPersonKeys);
        assert.equal(aliasPersonKeys![0].getOriginalType().toString(), `keyof typeof ${personStr}`);

        const p1Local = method?.getBody()?.getLocals().get('p1');
        assert.isDefined(p1Local);
        assert.equal(p1Local!.getType().toString(), `keyof typeof ${personStr}`);
        assert.equal((p1Local!.getDeclaringStmt() as ArkAssignStmt).getRightOp().toString(), 'this.<@type/typeOperator.ts: BasicKeyof.nameKey>');

        const p2Local = method?.getBody()?.getLocals().get('p2');
        assert.isDefined(p2Local);
        assert.equal(p2Local!.getType().toString(), `keyof typeof ${thisReturnValueStr}`);
    });
});

describe('Keyof Type With Different Types Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'typeOperator.ts');
    const objectClass = projectScene.getFile(fileId)?.getClassWithName('AllKeyofObject');

    it('keyof primitive type', () => {
        const aliases = objectClass?.getMethodWithName('keyofPrimitiveType')?.getBody()?.getAliasTypeMap();
        const aliasA = aliases?.get('A');
        assert.isDefined(aliasA);
        assert.equal(aliasA![0].getOriginalType().toString(), 'keyof any');
        const aliasB = aliases?.get('B');
        assert.isDefined(aliasB);
        assert.equal(aliasB![0].getOriginalType().toString(), 'keyof boolean');
        const aliasC = aliases?.get('C');
        assert.isDefined(aliasC);
        assert.equal(aliasC![0].getOriginalType().toString(), 'keyof number');
        const aliasD = aliases?.get('D');
        assert.isDefined(aliasD);
        assert.equal(aliasD![0].getOriginalType().toString(), 'keyof string');
        const aliasE = aliases?.get('E');
        assert.isDefined(aliasE);
        assert.equal(aliasE![0].getOriginalType().toString(), 'keyof null');
        const aliasF = aliases?.get('F');
        assert.isDefined(aliasF);
        assert.equal(aliasF![0].getOriginalType().toString(), 'keyof undefined');
        const aliasG = aliases?.get('G');
        assert.isDefined(aliasG);
        assert.equal(aliasG![0].getOriginalType().toString(), 'keyof void');
        const aliasH = aliases?.get('H');
        assert.isDefined(aliasH);
        assert.equal(aliasH![0].getOriginalType().toString(), 'keyof never');
    });

    it('keyof other object', () => {
        const aliases = objectClass?.getMethodWithName('keyofOtherTypes')?.getBody()?.getAliasTypeMap();

        const classKeys = aliases?.get('ClassKeys');
        assert.isDefined(classKeys);
        assert.equal(classKeys![0].getOriginalType().toString(), 'keyof @type/typeOperator.ts: BasicKeyof');

        const interfaceKeys = aliases?.get('InterfaceKeys');
        assert.isDefined(interfaceKeys);
        assert.equal(interfaceKeys![0].getOriginalType().toString(), 'keyof @type/typeOperator.ts: PersonInterface');

        const arrayKeys = aliases?.get('ArrayKeys');
        assert.isDefined(arrayKeys);
        assert.equal(arrayKeys![0].getOriginalType().toString(), 'keyof string[]');

        const tupleKeys = aliases?.get('TupleKeys');
        assert.isDefined(tupleKeys);
        assert.equal(tupleKeys![0].getOriginalType().toString(), 'keyof [string, number]');

        const enumKeys = aliases?.get('EnumKeys');
        assert.isDefined(enumKeys);
        assert.equal(enumKeys![0].getOriginalType().toString(), 'keyof typeof @type/typeOperator.ts: Color');

        const literalKeys = aliases?.get('LiteralKeys');
        assert.isDefined(literalKeys);
        const className = ((literalKeys![0].getOriginalType() as KeyofTypeExpr).getOpType() as ClassType).getClassSignature().getClassName();
        const ACClass = projectScene.getFile(fileId)?.getClassWithName(className);
        assert.isDefined(ACClass);
        assert.isNotNull(ACClass);
        assert.isDefined(ACClass!.getFieldWithName('a'));
        assert.isNotNull(ACClass!.getFieldWithName('b'));

        const unionKeys = aliases?.get('UnionKeys');
        assert.isDefined(unionKeys);
        assert.equal(unionKeys![0].getOriginalType().toString(), 'keyof (@type/typeOperator.ts: AllKeyofObject.keyofOtherTypes()#A|@type/typeOperator.ts: AllKeyofObject.keyofOtherTypes()#B)');
    });
});

describe('Keyof Type With Generic Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'typeOperator.ts');
    const basicClass = projectScene.getFile(fileId)?.getClassWithName('KeyofWithGeneric');
    const genericClassNumber = '@type/typeOperator.ts: GenericClass<number>';
    const genericClassA = '@type/typeOperator.ts: GenericClass<@type/typeOperator.ts: %dflt.[static]%dflt()#A>';
    const genericClass = '@type/typeOperator.ts: GenericClass';
    const genericTypeRealStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#PersonGenericType<string,number>';
    const personGenericStr = '@type/typeOperator.ts: %dflt.[static]%dflt()#PersonGenericType<string,number>';

    it('keyof class field', () => {
        const fieldNameKey = basicClass?.getFieldWithName('nameKey');
        assert.isDefined(fieldNameKey);
        assert.isNotNull(fieldNameKey);
        assert.equal(fieldNameKey!.getType().toString(), `keyof ${genericTypeRealStr}`);

        const fieldGenericKey = basicClass?.getFieldWithName('genericKey');
        assert.isDefined(fieldGenericKey);
        assert.isNotNull(fieldGenericKey);
        assert.equal(fieldGenericKey!.getType().toString(), `keyof typeof ${genericClassNumber}`);

        const fieldReferGenericKey = basicClass?.getFieldWithName('referGenericKey');
        assert.isDefined(fieldReferGenericKey);
        assert.isNotNull(fieldReferGenericKey);
        assert.equal(fieldReferGenericKey!.getType().toString(), `keyof typeof ${genericClassA}`);
    });

    it('keyof object type', () => {
        const method = basicClass?.getMethodWithName('keyofObjectType');

        const param = method?.getParameters()[0];
        assert.isDefined(param);
        assert.equal(param!.getType().toString(), `keyof ${genericTypeRealStr}`);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `keyof ${genericTypeRealStr}[]`);

        const aliases = method?.getBody()?.getAliasTypeMap();
        const aliasPersonKeys = aliases?.get('PersonKeys');
        assert.isDefined(aliasPersonKeys);
        assert.equal(aliasPersonKeys![0].getOriginalType().toString(), `keyof ${genericTypeRealStr}`);

        const p1Local = method?.getBody()?.getLocals().get('p1');
        assert.isDefined(p1Local);
        assert.equal(p1Local!.getType().toString(), `@type/typeOperator.ts: KeyofWithGeneric.keyofObjectType(keyof ${genericTypeRealStr})#PersonKeys`);
        const p2Local = method?.getBody()?.getLocals().get('p2');
        assert.isDefined(p2Local);
        assert.equal(p2Local!.getType().toString(), `keyof ${genericTypeRealStr}`);
    });

    it('keyof with typeof of object value', () => {
        const method = basicClass?.getMethodWithName('keyofWithTypeof');

        const param1 = method?.getParameters()[0];
        assert.isDefined(param1);
        assert.equal(param1!.getType().toString(), `keyof typeof ${personGenericStr}`);
        assert.equal((((param1!.getType() as KeyofTypeExpr).getOpType() as TypeQueryExpr).getOpValue() as Local).getType().toString(), genericTypeRealStr);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `keyof typeof ${personGenericStr}`);

        const aliases = method?.getBody()?.getAliasTypeMap();
        const aliasPersonKeys = aliases?.get('PersonKeys');
        assert.isDefined(aliasPersonKeys);
        assert.equal(aliasPersonKeys![0].getOriginalType().toString(), `keyof typeof ${personGenericStr}`);

        const p1Local = method?.getBody()?.getLocals().get('p1');
        assert.isDefined(p1Local);
        assert.equal(p1Local!.getType().toString(), `keyof typeof ${personGenericStr}`);
        assert.equal((p1Local!.getDeclaringStmt() as ArkAssignStmt).getRightOp().toString(), 'this.<@type/typeOperator.ts: KeyofWithGeneric.nameKey>');
    });

    it('keyof with typeof of generic class', () => {
        const method = basicClass?.getMethodWithName('typeofWithGeneric');

        const param1 = method?.getParameters()[0];
        assert.isDefined(param1);
        assert.equal(param1!.getType().toString(), `keyof typeof ${genericClassNumber}`);
        const param1TypeQueryExpr = (param1!.getType() as KeyofTypeExpr).getOpType();
        assert.equal(((param1TypeQueryExpr as TypeQueryExpr).getOpValue() as ArkClass).getSignature().toString(), genericClass);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `keyof typeof ${genericClassNumber}`);
        const returnTypeQueryExpr = (returnType! as KeyofTypeExpr).getOpType();
        assert.equal(((returnTypeQueryExpr as TypeQueryExpr).getOpValue() as ArkClass).getSignature().toString(), genericClass);

        const aliases = method?.getBody()?.getAliasTypeMap();
        const aliasPersonKeys = aliases?.get('PersonKeys');
        assert.isDefined(aliasPersonKeys);
        const aliasOriginalObject = aliasPersonKeys![0].getOriginalType();
        assert.equal(aliasOriginalObject.toString(), `keyof typeof ${genericClassNumber}`);

        const p1Local = method?.getBody()?.getLocals().get('p1');
        assert.isDefined(p1Local);
        assert.equal(p1Local!.getType().toString(), `keyof typeof ${genericClassNumber}`);
        assert.equal((p1Local!.getDeclaringStmt() as ArkAssignStmt).getRightOp().toString(), 'this.<@type/typeOperator.ts: KeyofWithGeneric.genericKey>');
    });

    it('keyof with typeof of reference generic type', () => {
        const method = basicClass?.getMethodWithName('typeofWithReferGeneric');

        const param1 = method?.getParameters()[0];
        assert.isDefined(param1);
        assert.equal(param1!.getType().toString(), `keyof typeof ${genericClassA}`);
        const param1TypeQueryExpr = (param1!.getType() as KeyofTypeExpr).getOpType();
        assert.equal(((param1TypeQueryExpr as TypeQueryExpr).getOpValue() as ArkClass).getSignature().toString(), genericClass);

        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), `keyof typeof ${genericClassA}`);
        const returnTypeQueryExpr = (returnType! as KeyofTypeExpr).getOpType();
        assert.equal(((returnTypeQueryExpr as TypeQueryExpr).getOpValue() as ArkClass).getSignature().toString(), genericClass);

        const aliases = method?.getBody()?.getAliasTypeMap();
        const aliasPersonKeys = aliases?.get('PersonKeys');
        assert.isDefined(aliasPersonKeys);
        const aliasOriginalObject = aliasPersonKeys![0].getOriginalType();
        assert.equal(aliasOriginalObject.toString(), `keyof typeof ${genericClassA}`);

        const p1Local = method?.getBody()?.getLocals().get('p1');
        assert.isDefined(p1Local);
        assert.equal(p1Local!.getType().toString(), `keyof typeof ${genericClassA}`);
        assert.equal((p1Local!.getDeclaringStmt() as ArkAssignStmt).getRightOp().toString(), 'this.<@type/typeOperator.ts: KeyofWithGeneric.genericKey>');
    });
});

describe('BigInt Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'bigIntType.ts');
    const targetClass = projectScene.getFile(fileId)?.getClassWithName('BigIntClass');
    const method = targetClass?.getMethodWithName('transfer2String');

    it('bigint class field', () => {
        const fieldA = targetClass?.getFieldWithName('fieldA');
        assert.isDefined(fieldA);
        assert.isNotNull(fieldA);
        assert.isTrue(fieldA!.getType() instanceof BigIntType);
        assert.equal(fieldA!.getType().toString(), `bigint`);
        assert.isAtLeast(fieldA!.getInitializer().length, 1);
        checkLocalInitWithBigIntConstant(fieldA!.getInitializer()[0], '1');

        const fieldB = targetClass?.getFieldWithName('fieldB');
        assert.isDefined(fieldB);
        assert.isNotNull(fieldB);
        assert.isTrue(fieldB!.getType() instanceof IntersectionType);
        assert.isTrue((fieldB!.getType() as IntersectionType).getTypes()[1] instanceof BigIntType);
        assert.equal(fieldB!.getType().toString(), `number&bigint`);

        const fieldC = targetClass?.getStaticFieldWithName('fieldC');
        assert.isDefined(fieldC);
        assert.isNotNull(fieldC);
        assert.isTrue(fieldC!.getType() instanceof UnionType);
        assert.isTrue((fieldC!.getType() as UnionType).getTypes()[0] instanceof BigIntType);
        assert.equal(fieldC!.getType().toString(), `bigint|number`);
    });

    it('bigint method param', () => {
        const params = method?.getSubSignature().getParameters();
        assert.isDefined(params);
        assert.isAtLeast(params!.length, 1);
        assert.isTrue(params![0].getType() instanceof UnionType);
        assert.isTrue((params![0].getType() as UnionType).getTypes()[1] instanceof BigIntType);
        assert.equal(params![0].getType().toString(), `number|bigint`);
    });

    it('bigint method return type', () => {
        const returnType = method?.getReturnType();
        assert.isDefined(returnType);
        assert.isTrue(returnType instanceof UnionType);
        assert.isTrue((returnType as UnionType).getTypes()[1] instanceof BigIntType);
        assert.equal(returnType!.toString(), `string|bigint`);
    });

    it('bigint method local', () => {
        checkLocalWithBigIntType('a', method);
        checkLocalWithBigIntType('b', method);
        checkLocalWithBigIntType('c', method);
        checkLocalWithBigIntType('%0', method);
        checkLocalWithBigIntType('%1', method);
        checkLocalWithBigIntType('%2', method);
        checkLocalWithBigIntType('%3', method);
        checkLocalWithBigIntType('%4', method);

        const resLocal = method?.getBody()?.getLocals().get('%5');
        assert.isDefined(resLocal);
        assert.isTrue(resLocal!.getType() instanceof UnknownType);

        const stmts = method?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmts);
        assert.isAtLeast(stmts!.length, 4);
        checkLocalInitWithBigIntConstant(stmts![3], '10');
        checkLocalInitWithBigIntConstant(stmts![4], '100');
    });

    it('bigint bit operator stmt', () => {
        const bitOperator = targetClass?.getMethodWithName('testBitOperator');
        checkLocalWithBigIntType('a', bitOperator);
        checkLocalWithBigIntType('b', bitOperator);
        checkLocalWithBigIntType('c', bitOperator);

        checkLocalWithNumberType('aa', bitOperator);
        checkLocalWithNumberType('bb', bitOperator);
        checkLocalWithNumberType('cc', bitOperator);
    });

    it('bigint alias type', () => {
        const method = projectScene.getFile(fileId)?.getDefaultClass()?.getDefaultArkMethod();
        const aliasType = method?.getBody()?.getAliasTypeByName('IntersectionType');
        assert.isDefined(aliasType);
        assert.isNotNull(aliasType);
        assert.isTrue(aliasType!.getOriginalType() instanceof IntersectionType);
        assert.isTrue((aliasType!.getOriginalType() as IntersectionType).getTypes()[1] instanceof BigIntType);
    });
});

describe('Save to TS Test', () => {
    let arkFile = projectScene.getFiles().find((value) => {
        return value.getName() === 'test.ts';
    });

    it('case1: method simpleAliasType', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('simpleAliasType');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceSimpleAliasType);
    });

    it('case2: method aliasTypeWithImport', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithImport');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithImport);
    });

    it('case3: method aliasTypeWithTypeQuery', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithTypeQuery');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithTypeQuery);
    });

    it('case4: method aliasTypeWithReference', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithReference');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithReference);
    });

    it('case5: method aliasTypeWithLiteralType', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithLiteralType');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithLiteralType);
    });

    it('case6: method aliasTypeWithFunctionType', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithFunctionType');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithFunctionType);
    });

    it('case7: method aliasTypeWithUnionType', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithUnionType');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithUnionType);
    });

    it('case8: method aliasTypeWithGenericType', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithGenericType');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithGenericType);
    });

    it('case9: method aliasTypeWithClassType', () => {
        assert.isDefined(arkFile);
        let arkMethod = arkFile!.getDefaultClass().getMethodWithName('aliasTypeWithClassType');
        assert.isDefined(arkMethod);

        let printer = new SourceMethodPrinter(arkMethod!);
        let source = printer.dump();
        assert.equal(source, SourceAliasTypeWithClassType);
    });

    it('case10: intersection type', () => {
        let arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'intersectionType.ts';
        });
        let defaultMethod = arkFile?.getDefaultClass().getDefaultArkMethod();
        assert.isDefined(defaultMethod);
        assert.isNotNull(defaultMethod);

        let defaultPrinter = new SourceMethodPrinter(defaultMethod!);
        let defaultSource = defaultPrinter.dump();
        assert.equal(defaultSource, SourceIntersectionTypeForDefaultMethod);

        let method = arkFile?.getDefaultClass().getMethodWithName('animal');
        assert.isDefined(method);
        assert.isNotNull(method);

        let functionPrinter = new SourceMethodPrinter(method!);
        let functionSource = functionPrinter.dump();
        assert.equal(functionSource, SourceIntersectionTypeForFunction);

        let interClass = arkFile?.getClassWithName('Inter');
        assert.isDefined(interClass);
        assert.isNotNull(interClass);

        let classPrinter = new SourceClassPrinter(interClass!);
        let source = classPrinter.dump();
        assert.equal(source, SourceIntersectionTypeForClass);
    });

    it('case11: class BasicReadonly of typeOperator', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'typeOperator.ts';
        });
        const arkClass = arkFile?.getClassWithName('BasicReadonly');
        assert.isDefined(arkClass);
        const printer = new SourceClassPrinter(arkClass!);
        let source = printer.dump();
        assert.equal(source, SourceBasicReadonlyClassWithTypeOperator);
    });

    it('case12: class ReadonlyOfReferenceType of typeOperator', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'typeOperator.ts';
        });
        const arkClass = arkFile?.getClassWithName('ReadonlyOfReferenceType');
        assert.isDefined(arkClass);
        const printer = new SourceClassPrinter(arkClass!);
        let source = printer.dump();
        assert.equal(source, SourceReadonlyOfReferenceTypeClassWithTypeOperator);
    });

    it('case13: class ReadonlyOfGenericType of typeOperator', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'typeOperator.ts';
        });
        const arkClass = arkFile?.getClassWithName('ReadonlyOfGenericType');
        assert.isDefined(arkClass);
        const printer = new SourceClassPrinter(arkClass!);
        let source = printer.dump();
        assert.equal(source, SourceReadonlyOfGenericTypeClassWithTypeOperator);
    });

    it('case14: class BasicKeyof of typeOperator', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'typeOperator.ts';
        });
        const arkClass = arkFile?.getClassWithName('BasicKeyof');
        assert.isDefined(arkClass);
        const printer = new SourceClassPrinter(arkClass!);
        let source = printer.dump();
        assert.equal(source, SourceBasicKeyofClassWithTypeOperator);
    });

    it('case15: class AllKeyofObject of typeOperator', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'typeOperator.ts';
        });
        const arkClass = arkFile?.getClassWithName('AllKeyofObject');
        assert.isDefined(arkClass);
        const printer = new SourceClassPrinter(arkClass!);
        let source = printer.dump();
        assert.equal(source, SourceAllKeyofObjectClassWithTypeOperator);
    });

    it('case16: class KeyofWithGeneric of typeOperator', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'typeOperator.ts';
        });
        const arkClass = arkFile?.getClassWithName('KeyofWithGeneric');
        assert.isDefined(arkClass);
        const printer = new SourceClassPrinter(arkClass!);
        let source = printer.dump();
        assert.equal(source, SourceKeyofWithGenericClassWithTypeOperator);
    });

    it('case17: bigint type', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'bigIntType.ts';
        });
        assert.isDefined(arkFile);
        const printer = new SourceFilePrinter(arkFile!);
        let source = printer.dump();
        assert.equal(source, SourceBigIntType);
    });
});

describe('Save to IR Test', () => {
    it('case1: bigint type', () => {
        const arkFile = projectScene.getFiles().find((value) => {
            return value.getName() === 'bigIntType.ts';
        });
        assert.isDefined(arkFile);
        let printer = new ArkIRFilePrinter(arkFile!);
        let source = printer.dump();
        assert.equal(source, IRBigIntType);
    });
});

describe('Object Type Test', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'objectType.ts');
    const arkFile = projectScene.getFile(fileId);
    const classA = arkFile?.getClassWithName('ClassA');
    const defaultClass = arkFile?.getDefaultClass();
    const objectTypeStr = '@built-in/lib.es5.d.ts: Object';
    const objectConstructorTypeStr = '@built-in/lib.es2015.core.d.ts: ObjectConstructor';
    const builtInObjectTypeStr = '@built-in/lib.es5.d.ts: Object';

    it('case1: whole ir', () => {
        assert.isNotNull(arkFile);
        const printer = new ArkIRFilePrinter(arkFile!);
        const ir = printer.dump();
        assert.equal(ir, SourceIROfObjectType);
    });

    it('case2: class field Type', () => {
        const fieldA = classA?.getFieldWithName('fieldA');
        assert.isDefined(fieldA);
        assert.isNotNull(fieldA);
        assert.equal(fieldA!.getType().toString(), objectTypeStr);
    });

    it('case3: method param Type', () => {
        const params = defaultClass?.getMethodWithName('foo')?.getParameters();
        assert.isDefined(params);
        assert.isAtLeast(params!.length, 1);
        assert.equal(params![0].getType().toString(), objectTypeStr);
    });

    it('case4: method return Type', () => {
        const returnType = defaultClass?.getMethodWithName('foo')?.getReturnType();
        assert.isDefined(returnType);
        assert.equal(returnType!.toString(), objectTypeStr);
    });

    it('case5: method local Type', () => {
        const localsFoo = defaultClass?.getMethodWithName('foo')?.getBody()?.getLocals();
        const localObj = localsFoo?.get('obj');
        assert.isDefined(localObj);
        assert.equal(localObj!.getType().toString(), objectTypeStr);

        const localsDefault = defaultClass?.getDefaultArkMethod()?.getBody()?.getLocals();
        const localEmptyObj = localsDefault?.get('emptyObj');
        assert.isDefined(localEmptyObj);
        assert.equal(localEmptyObj!.getType().toString(), objectTypeStr);
        const localA = localsDefault?.get('a');
        assert.isDefined(localA);
        assert.equal(localA!.getType().toString(), objectTypeStr);
        const localB = localsDefault?.get('b');
        assert.isDefined(localB);
        assert.equal(localB!.getType().toString(), objectTypeStr);
        const localNewEmptyObj = localsDefault?.get('newEmptyObj');
        assert.isDefined(localNewEmptyObj);
        assert.equal(localNewEmptyObj!.getType().toString(), '@type/objectType.ts: %dflt.[static]%dflt()#newObject');
        assert.isTrue(localNewEmptyObj!.getType() instanceof AliasType);
        assert.equal((localNewEmptyObj!.getType() as AliasType).getOriginalType().getTypeString(), objectTypeStr);
    });

    it('case6: alias Type', () => {
        const aliasNewObject = defaultClass?.getDefaultArkMethod()?.getBody()?.getAliasTypeMap()?.get('newObject');
        assert.isDefined(aliasNewObject);
        assert.equal(aliasNewObject![0].getOriginalType().toString(), objectTypeStr);
    });

    it('case7: method invoke expr', () => {
        const stmtsDefault = defaultClass?.getDefaultArkMethod()?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmtsDefault);
        assert.isAtLeast(stmtsDefault!.length, 7);
        assert.isTrue(stmtsDefault![6] instanceof ArkAssignStmt);
        assert.isTrue((stmtsDefault![6] as ArkAssignStmt).getRightOp() instanceof ArkStaticFieldRef);
        assert.equal(((stmtsDefault![6] as ArkAssignStmt).getRightOp() as ArkStaticFieldRef).getFieldSignature().toString(), `@built-in/lib.es5.d.ts: ObjectConstructor.prototype`);
        assert.isTrue(stmtsDefault![7] instanceof ArkAssignStmt);
        assert.isTrue((stmtsDefault![7] as ArkAssignStmt).getRightOp() instanceof ArkStaticInvokeExpr);
        assert.equal(((stmtsDefault![7] as ArkAssignStmt).getRightOp() as ArkStaticInvokeExpr).getMethodSignature().toString(), `@built-in/lib.es5.d.ts: ObjectConstructor.create(any)`);

        const stmtsFoo = defaultClass?.getMethodWithName('foo')?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmtsFoo);
        assert.isAtLeast(stmtsFoo!.length, 3);
        assert.isTrue(stmtsFoo![2] instanceof ArkInvokeStmt);
        assert.isTrue((stmtsFoo![2] as ArkInvokeStmt).getInvokeExpr() instanceof ArkStaticInvokeExpr);
        assert.equal(((stmtsFoo![2] as ArkInvokeStmt).getInvokeExpr() as ArkStaticInvokeExpr).getMethodSignature().toString(), `${objectConstructorTypeStr}.keys(@built-in/lib.es2015.core.d.ts: %AC3)`);

        assert.isTrue(stmtsFoo![3] instanceof ArkInvokeStmt);
        assert.isTrue((stmtsFoo![3] as ArkInvokeStmt).getInvokeExpr() instanceof ArkInstanceInvokeExpr);
        assert.equal(((stmtsFoo![3] as ArkInvokeStmt).getInvokeExpr() as ArkInstanceInvokeExpr).getBase().toString(), 'obj');
        assert.equal(((stmtsFoo![3] as ArkInvokeStmt).getInvokeExpr() as ArkInstanceInvokeExpr).getMethodSignature().toString(), `${builtInObjectTypeStr}.toLocaleString()`);
    });

    it('case8: class field invoke expr', () => {
        const stmtsKeys = classA?.getMethodWithName('keys')?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmtsKeys);
        assert.isAtLeast(stmtsKeys!.length, 2);
        assert.isTrue(stmtsKeys![1] instanceof ArkAssignStmt);
        assert.isTrue((stmtsKeys![1] as ArkAssignStmt).getRightOp() instanceof ArkInstanceFieldRef);
        assert.equal(((stmtsKeys![1] as ArkAssignStmt).getRightOp() as ArkInstanceFieldRef).getFieldSignature().getType().toString(), objectTypeStr);
        assert.isTrue(stmtsKeys![2] instanceof ArkInvokeStmt);
        assert.isTrue((stmtsKeys![2] as ArkInvokeStmt).getInvokeExpr() instanceof ArkStaticInvokeExpr);
        assert.equal(((stmtsKeys![2] as ArkInvokeStmt).getInvokeExpr() as ArkStaticInvokeExpr).getMethodSignature().toString(), `${objectConstructorTypeStr}.keys(@built-in/lib.es2015.core.d.ts: %AC3)`);

        const stmtshasA = classA?.getMethodWithName('hasA')?.getBody()?.getCfg().getStmts();
        assert.isDefined(stmtshasA);
        assert.isAtLeast(stmtshasA!.length, 2);
        assert.isTrue(stmtshasA![1] instanceof ArkAssignStmt);
        assert.isTrue((stmtshasA![1] as ArkAssignStmt).getRightOp() instanceof ArkInstanceFieldRef);
        assert.equal(((stmtshasA![1] as ArkAssignStmt).getRightOp() as ArkInstanceFieldRef).getFieldSignature().getType().toString(), objectTypeStr);
        assert.isTrue(stmtshasA![2] instanceof ArkAssignStmt);
        assert.isTrue((stmtshasA![2] as ArkAssignStmt).getRightOp() instanceof ArkInstanceInvokeExpr);
        assert.equal(((stmtshasA![2] as ArkAssignStmt).getRightOp() as ArkInstanceInvokeExpr).getMethodSignature().toString(), `${builtInObjectTypeStr}.toLocaleString()`);
    });
});

describe('Type of Binary Operator', () => {
    const fileId = new FileSignature(projectScene.getProjectName(), 'numberType.ts');
    const arkFile = projectScene.getFile(fileId);

    it('case1: binary operator of Exponentiation', () => {
        const stmts = arkFile?.getDefaultClass().getMethodWithName('testBinaryOperator')?.getCfg()?.getStmts();
        assert.isDefined(stmts);
        assert.isAtLeast(stmts!.length, 2);
        assert.isTrue((stmts![1] as ArkAssignStmt).getLeftOp().getType() instanceof NumberType);
    });
});
