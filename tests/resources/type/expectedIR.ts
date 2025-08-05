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

import {
    AliasType,
    ArkAliasTypeDefineStmt,
    ArkClass,
    ArkField,
    ArkMethod,
    ArrayType,
    BooleanType,
    DEFAULT_ARK_CLASS_NAME,
    GenericType,
    ImportInfo,
    LiteralType,
    Local,
    StringType,
    TupleType,
    UnionType
} from '../../../src';

export const AliasTypeOfBoolean = {
    aliasType: {
        name: 'BooleanAliasType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.simpleAliasType()#BooleanAliasType`,
        modifiers: 0,
        originalType: 'boolean'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: BooleanType,
                toString: 'boolean'
            },
            transferWithTypeOf: false,
            toString: 'boolean'
        },
        toString: 'type @type/test.ts: %dflt.simpleAliasType()#BooleanAliasType = boolean',
        line: 19,
        column: 5,
        operandColumns: [[10, 26], [29, 36]]
    }
};

export const AliasTypeOfString = {
    aliasType: {
        name: 'StringAliasType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.simpleAliasType()#StringAliasType`,
        modifiers: 0,
        originalType: 'string'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: StringType,
                toString: 'string'
            },
            transferWithTypeOf: false,
            toString: 'string'
        },
        toString: 'type @type/test.ts: %dflt.simpleAliasType()#StringAliasType = string',
        line: 20,
        column: 5,
        operandColumns: [[10, 25], [28, 34]]
    }
};

export const AliasTypeOfClassA = {
    aliasType: {
        name: 'ClassAType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithImport()#ClassAType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: ClassA',
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ImportInfo,
                lazyExportInfo: {
                    arkExport: {
                        signature: '@type/exportExample.ts: ClassA'
                    }
                }
            },
            transferWithTypeOf: false,
            toString: 'import(\'./exportExample\').ClassA'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithImport()#ClassAType = import(\'./exportExample\').ClassA',
        line: 28,
        column: 5,
        operandColumns: [[10, 20], [23, 55]]
    }
};

export const AliasTypeOfClassB = {
    aliasType: {
        name: 'ClassBType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithImport()#ClassBType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: ClassB',
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ImportInfo,
                lazyExportInfo: {
                    arkExport: {
                        signature: '@type/exportExample.ts: ClassB'
                    }
                }
            },
            transferWithTypeOf: false,
            toString: 'import(\'./exportExample\').default'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithImport()#ClassBType = import(\'./exportExample\').default',
        line: 29,
        column: 5,
        operandColumns: [[10, 20], [23, 56]]
    }
};

export const AliasTypeOfNumberA = {
    aliasType: {
        name: 'NumberAType',
        signature: `@type/test.ts: %dflt.aliasTypeWithImport()#NumberAType`,
        modifiers: 0,
        originalType: `@type/exportExample.ts: %dflt.[static]%dflt()#numberA`,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ImportInfo,
                lazyExportInfo: {
                    arkExport: {
                        signature: '@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
                    }
                }
            },
            transferWithTypeOf: false,
            toString: 'import(\'./exportExample\').numberA'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithImport()#NumberAType = import(\'./exportExample\').numberA',
        line: 30,
        column: 5,
        operandColumns: [[10, 21], [24, 57]]
    }
};

export const AliasTypeOfMultiQualifier = {
    aliasType: {
        name: 'MultiQualifierType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithImport()#MultiQualifierType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: A.B.C'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ImportInfo,
                lazyExportInfo: {
                    arkExport: {
                        signature: '@type/exportExample.ts: A.B.C'
                    }
                },
            },
            transferWithTypeOf: false,
            toString: 'import(\'./exportExample\').A.B.C'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithImport()#MultiQualifierType = import(\'./exportExample\').A.B.C',
        line: 31,
        column: 5,
        operandColumns: [[10, 28], [31, 62]]
    }
};

export const AliasTypeOfObjectA = {
    aliasType: {
        name: 'ObjectAType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithImport()#ObjectAType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: %AC0$%dflt.%dflt'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ImportInfo,
                lazyExportInfo: {
                    arkExport: {
                        signature: '@type/exportExample.ts: %AC0$%dflt.%dflt'
                    }
                },
            },
            transferWithTypeOf: true,
            toString: 'typeof import(\'./exportExample\').objectA'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithImport()#ObjectAType = typeof import(\'./exportExample\').objectA',
        line: 33,
        column: 5,
        operandColumns: [[10, 21], [24, 64]]
    }
};

// TODO: originalObject should be the map of all exports of the import file
export const AliasTypeOfWholeExports = {
    aliasType: {
        name: 'WholeExportsType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithImport()#WholeExportsType`,
        modifiers: 0,
        originalType: 'unknown'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ImportInfo,
                lazyExportInfo: null
            },
            transferWithTypeOf: true,
            toString: 'typeof import(\'./exportExample\')'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithImport()#WholeExportsType = typeof import(\'./exportExample\')',
        line: 34,
        column: 5,
        operandColumns: [[10, 26], [29, 61]]
    }
};

export const AliasTypeOfSingleTypeQuery = {
    aliasType: {
        name: 'SingleTypeQuery',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithTypeQuery()#SingleTypeQuery`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: %AC0$%dflt.%dflt'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: Local,
                typeString: '@type/exportExample.ts: %AC0$%dflt.%dflt',
                declaringStmt: 'objectA = %0'
            },
            transferWithTypeOf: true,
            toString: 'typeof objectA'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithTypeQuery()#SingleTypeQuery = typeof objectA',
        line: 43,
        column: 5,
        operandColumns: [[10, 25], [28, 42]]
    }
};

// TODO: expr with ArkField toString should be objectA.a.b.c
export const AliasTypeOfMultiTypeQuery = {
    aliasType: {
        name: 'MultiTypeQuery',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithTypeQuery()#MultiTypeQuery`,
        modifiers: 0,
        originalType: 'string'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArkField,
                signature: '@type/exportExample.ts: %AC2$%AC1$%AC0$%dflt.%dflt.%instInit.%instInit.c'
            },
            transferWithTypeOf: true,
            toString: 'typeof c'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithTypeQuery()#MultiTypeQuery = typeof c',
        line: 44,
        column: 5,
        operandColumns: [[10, 24], [27, 47]]
    }
};

export const AliasTypeRef = {
    aliasType: {
        name: 'ReferType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithReference()#ReferType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: AliasType,
                toString: '@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
            },
            transferWithTypeOf: false,
            toString: '@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithReference()#ReferType = @type/exportExample.ts: %dflt.[static]%dflt()#numberA',
        line: 48,
        column: 5,
        operandColumns: [[10, 19], [22, 29]]
    }
};

export const AliasTypeMultiRef = {
    aliasType: {
        name: 'MultiReferType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithReference()#MultiReferType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: A.B.C'
    },
    stmts: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArkClass,
                signature: '@type/exportExample.ts: A.B.C'
            },
            transferWithTypeOf: false,
            toString: '@type/exportExample.ts: A.B.C'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithReference()#MultiReferType = @type/exportExample.ts: A.B.C',
        line: 49,
        column: 5,
        operandColumns: [[10, 24], [27, 32]]
    }
};

export const AliasTypeOfLiteralType = {
    aliasType: {
        name: 'ABC',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithLiteralType()#ABC`,
        modifiers: 16384,
        originalType: '\'123\''
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: LiteralType,
                toString: '\'123\''
            },
            transferWithTypeOf: false,
            toString: '\'123\''
        },
        toString: 'declare type @type/test.ts: %dflt.aliasTypeWithLiteralType()#ABC = \'123\'',
        line: 53,
        column: 5,
        operandColumns: [[18, 21], [24, 29]]
    }
};

export const AliasTypeOfQueryOfLiteralType = {
    aliasType: {
        name: 'XYZ',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithLiteralType()#XYZ`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.aliasTypeWithLiteralType()#ABC'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: Local,
                typeString: '@type/test.ts: %dflt.aliasTypeWithLiteralType()#ABC',
                declaringStmt: 'a = \'123\''
            },
            transferWithTypeOf: true,
            toString: 'typeof a'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithLiteralType()#XYZ = typeof a',
        line: 55,
        column: 5,
        operandColumns: [[10, 13], [16, 24]]
    }
};

export const AliasTypeOfFunctionType = {
    aliasType: {
        name: 'FunctionAliasType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithFunctionType()#FunctionAliasType`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.aliasTypeWithLiteralType()'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArkMethod,
                signature: '@type/test.ts: %dflt.aliasTypeWithLiteralType()'
            },
            transferWithTypeOf: true,
            toString: 'typeof @type/test.ts: %dflt.aliasTypeWithLiteralType()'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithFunctionType()#FunctionAliasType = typeof @type/test.ts: %dflt.aliasTypeWithLiteralType()',
        line: 59,
        column: 5,
        operandColumns: [[10, 27], [30, 61]]
    }
};

export const AliasTypeOfGenericFunctionType = {
    aliasType: {
        name: 'NumberGenericFunction',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithFunctionType()#NumberGenericFunction`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.functionWithGeneric(T)',
        functionTypeRealGenericTypes: ['number'],
        genericTypes: undefined,
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArkMethod,
                signature: '@type/test.ts: %dflt.functionWithGeneric(T)'
            },
            transferWithTypeOf: true,
            realGenericTypes: ['number'],
            toString: 'typeof @type/test.ts: %dflt.functionWithGeneric<number>(number)'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithFunctionType()#NumberGenericFunction = typeof @type/test.ts: %dflt.functionWithGeneric<number>(number)',
        line: 60,
        column: 5,
        operandColumns: [[10, 31], [34, 68]]
    }
};

export const AliasTypeOfUnionType = {
    aliasType: {
        name: 'UnionAliasType',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithUnionType()#UnionAliasType`,
        modifiers: 0,
        originalType: '@type/exportExample.ts: A.B.C|@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: UnionType,
                toString: '@type/exportExample.ts: A.B.C|@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
            },
            transferWithTypeOf: false,
            toString: '@type/exportExample.ts: A.B.C|@type/exportExample.ts: %dflt.[static]%dflt()#numberA'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithUnionType()#UnionAliasType = @type/exportExample.ts: A.B.C|@type/exportExample.ts: %dflt.[static]%dflt()#numberA',
        line: 68,
        column: 5,
        operandColumns: [[10, 24], [27, 42]]
    }
};

export const AliasTypeOfGenericType = {
    aliasType: {
        name: 'Generic',
        signature: `@type/test.ts: ${DEFAULT_ARK_CLASS_NAME}.aliasTypeWithGenericType()#Generic`,
        modifiers: 0,
        originalType: 'T',
        genericTypes: ['T'],
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: GenericType,
                toString: 'T'
            },
            transferWithTypeOf: false,
            realGenericTypes: undefined,
            toString: 'T'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#Generic<T> = T',
        line: 72,
        column: 5,
        operandColumns: [[10, 17], [23, 24]]
    }
};

export const AliasTypeOfGenericTypeWithNumber = {
    aliasType: {
        name: 'GenericNumber',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericNumber`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.aliasTypeWithGenericType()#Generic<number>',
        genericTypes: undefined,
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: AliasType,
                toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#Generic<T>'
            },
            transferWithTypeOf: false,
            realGenericTypes: ['number'],
            toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#Generic<number>'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericNumber = @type/test.ts: %dflt.aliasTypeWithGenericType()#Generic<number>',
        line: 73,
        column: 5,
        operandColumns: [[10, 23], [26, 41]]
    }
};

export const AliasTypeOfGenericArrayType = {
    aliasType: {
        name: 'GenericArray',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArray`,
        modifiers: 0,
        originalType: 'T[]',
        genericTypes: ['T'],
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArrayType,
                toString: 'T[]'
            },
            transferWithTypeOf: false,
            realGenericTypes: undefined,
            toString: 'T[]'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArray<T> = T[]',
        line: 75,
        column: 5,
        operandColumns: [[10, 22], [28, 31]]
    }
};

export const AliasTypeOfGenericArrayTypeWithNumber = {
    aliasType: {
        name: 'GenericArrayNumber',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArrayNumber`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArray<number>',
        genericTypes: undefined,
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: AliasType,
                toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArray<T>'
            },
            transferWithTypeOf: false,
            realGenericTypes: ['number'],
            toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArray<number>'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArrayNumber = @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericArray<number>',
        line: 76,
        column: 5,
        operandColumns: [[10, 28], [31, 51]]
    }
};

export const AliasTypeOfGenericTupleType = {
    aliasType: {
        name: 'GenericTuple',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTuple`,
        modifiers: 0,
        originalType: '[T, U]',
        genericTypes: ['T', 'U'],
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: TupleType,
                toString: '[T, U]'
            },
            transferWithTypeOf: false,
            realGenericTypes: undefined,
            toString: '[T, U]'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTuple<T,U> = [T, U]',
        line: 78,
        column: 5,
        operandColumns: [[10, 22], [31, 37]]
    }
};

export const AliasTypeOfGenericTupleTypeWithNumber = {
    aliasType: {
        name: 'GenericTupleStringNumber',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTupleStringNumber`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTuple<string,number>',
        genericTypes: undefined,
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: AliasType,
                toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTuple<T,U>'
            },
            transferWithTypeOf: false,
            realGenericTypes: ['string', 'number'],
            toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTuple<string,number>'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTupleStringNumber = @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericTuple<string,number>',
        line: 79,
        column: 5,
        operandColumns: [[10, 34], [37, 65]]
    }
};

export const AliasTypeOfGenericObjectType = {
    aliasType: {
        name: 'GenericObject',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObject`,
        modifiers: 0,
        originalType: '@type/test.ts: %AC0<X,Y>',
        genericTypes: ['X', 'Y'],
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArkClass,
                signature: '@type/test.ts: %AC0',
            },
            transferWithTypeOf: false,
            realGenericTypes: undefined,
            toString: '@type/test.ts: %AC0'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObject<X,Y> = @type/test.ts: %AC0',
        line: 81,
        column: 5,
        operandColumns: [[10, 23], [32, 6]]
    }
};

export const AliasTypeOfGenericObjectWithBooleanNumber = {
    aliasType: {
        name: 'GenericObjectBooleanNumber',
        signature: `@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObjectBooleanNumber`,
        modifiers: 0,
        originalType: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObject<boolean,number>',
        genericTypes: undefined,
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: AliasType,
                toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObject<X,Y>'
            },
            transferWithTypeOf: false,
            realGenericTypes: ['boolean', 'number'],
            toString: '@type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObject<boolean,number>'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObjectBooleanNumber = @type/test.ts: %dflt.aliasTypeWithGenericType()#GenericObject<boolean,number>',
        line: 85,
        column: 5,
        operandColumns: [[10, 36], [39, 69]]
    }
};

export const AliasTypeOfGenericClassType = {
    aliasType: {
        name: 'StringClass',
        signature: `@type/test.ts: %dflt.aliasTypeWithClassType()#StringClass`,
        modifiers: 0,
        originalType: '@type/test.ts: ClassWithGeneric<string>',
        genericTypes: undefined,
        realGenericTypes: undefined,
    },
    stmt: {
        instanceof: ArkAliasTypeDefineStmt,
        typeAliasExpr: {
            originalObject: {
                instanceof: ArkClass,
                signature: '@type/test.ts: ClassWithGeneric'
            },
            transferWithTypeOf: false,
            realGenericTypes: 'string',
            toString: '@type/test.ts: ClassWithGeneric<string>'
        },
        toString: 'type @type/test.ts: %dflt.aliasTypeWithClassType()#StringClass = @type/test.ts: ClassWithGeneric<string>',
        line: 93,
        column: 5,
        operandColumns: [[10, 21], [24, 48]]
    }
};

export const SourceSimpleAliasType = `function simpleAliasType(): void {
  type BooleanAliasType = boolean;
  type StringAliasType = string;
}
`;

export const SourceAliasTypeWithImport = `function aliasTypeWithImport(): void {
  type ClassAType = import('./exportExample').ClassA;
  type ClassBType = import('./exportExample').default;
  type NumberAType = import('./exportExample').numberA;
  type MultiQualifierType = import('./exportExample').A.B.C;
  type ObjectAType = typeof import('./exportExample').objectA;
  type WholeExportsType = typeof import('./exportExample');
}
`;

// TODO: MultiTypeQuery expr should be typeof objectA.a.b.c
export const SourceAliasTypeWithTypeQuery = `function aliasTypeWithTypeQuery(): void {
  type SingleTypeQuery = typeof objectA;
  type MultiTypeQuery = typeof c;
}
`;

export const SourceAliasTypeWithReference = `function aliasTypeWithReference(): void {
  type ReferType = numberA;
  type MultiReferType = A.B.C;
}
`;

export const SourceAliasTypeWithLiteralType = `function aliasTypeWithLiteralType(): void {
  declare type ABC = '123';
  let a: ABC = '123';
  type XYZ = typeof a;
}
`;

export const SourceAliasTypeWithFunctionType = `function aliasTypeWithFunctionType(): void {
  type FunctionAliasType = typeof aliasTypeWithLiteralType;
  type NumberGenericFunction = typeof functionWithGeneric<number>;
}
`;

export const SourceAliasTypeWithUnionType = `function aliasTypeWithUnionType(): void {
  type UnionAliasType = A.B.C | numberA;
}
`;

export const SourceAliasTypeWithGenericType = `function aliasTypeWithGenericType(): void {
  type Generic<T> = T;
  type GenericNumber = Generic<number>;
  type GenericArray<T> = T[];
  type GenericArrayNumber = GenericArray<number>;
  type GenericTuple<T, U> = [T, U];
  type GenericTupleStringNumber = GenericTuple<string, number>;
  type GenericObject<X, Y> = {x: X, y: Y};
  type GenericObjectBooleanNumber = GenericObject<boolean, number>;
}
`;

export const SourceAliasTypeWithClassType = `function aliasTypeWithClassType(): void {
  type StringClass = ClassWithGeneric<string>;
}
`;

export const SourceIntersectionTypeForDefaultMethod = `type IntersectionType = string & number & void;
type ComplicatedType = string | ((number & any) & (string | void));
type IC = IA & IB;
type A = {name: string, age: number};
type B = {name: string, gender: 'male' | 'female'};
type C = A & B;
type Person = {name: string, age: number};
type Employee = Person & {employeeId: number};
type CanEatAndSleep = CanEat & CanSleep;
let student: A & B = {name: 'abc', age: 12, gender: 'male'};
`;

export const SourceIntersectionTypeForFunction = `function animal(property: CanEat & CanSleep): A & B {
  property.eat();
  property.sleep();
  return {name: 'abc', age: 12, gender: 'male'};
}
`;

export const SourceIntersectionTypeForClass = `class Inter {
  private fieldA: string & number;
  fieldB: A & B;
  static fieldC: Employee & (number | boolean);
}
`;

export const SourceBasicReadonlyClassWithTypeOperator = `class BasicReadonly {
  fieldA: readonly string[] = ['a', 'b'];
  fieldB: boolean[] = [false];
  readonlyVariable(param: readonly [number, string]): readonly boolean[] {
    let tupleLocal: [number, string] = [123, '123'];
    let readonlyTupleLocal: readonly [number, string] = [123, '123'];
    let arrayLocal: number[] = [123, 345];
    let readonlyArrayLocal: readonly number[] = [123, 345];
    return [true];
  }
  readonlyAliasType(param: [number, string]): string[] {
    type A = readonly string[];
    type B = readonly string[] | readonly [number, string];
    type C = readonly string[] & readonly [number, string];
    type D = readonly (string & number)[] & readonly (string | number)[];
    type E = string[];
    type F = string[] | [number, string];
    type G = string[] & [number, string];
    return ['hello', 'world'];
  }
}
`;

export const SourceReadonlyOfReferenceTypeClassWithTypeOperator = `class ReadonlyOfReferenceType {
  fieldA: readonly A[] = [true, false];
  fieldB: readonly [A, boolean] = [true, false];
  readonlyVariable(param: readonly [A, string]): readonly A[] {
    type B = readonly A[] | string;
    let readonlyTupleLocal: readonly [number, B] = [123, '123'];
    let readonlyArrayLocal: readonly B[] = [[true], '123'];
    return [true];
  }
}
`;

export const SourceReadonlyOfGenericTypeClassWithTypeOperator = `class ReadonlyOfGenericType {
  fieldA: readonly C<boolean>[] = [true, false];
  fieldB: readonly [C<boolean>, boolean] = [true, false];
  readonlyVariable(param: readonly [C<string>, string]): readonly C<boolean>[] {
    type D = readonly C<number>[] | string;
    let readonlyUnionLocal: number[] | readonly C<string>[] = [123];
    let readonlyIntersectionLocal: number[] & readonly C<string>[] = [123];
    return [true];
  }
}
`;

export const SourceBasicKeyofClassWithTypeOperator = `class BasicKeyof {
  private nameKey: keyof PersonType = 'name';
  private ageKey: keyof typeof person = 'age';
  private returnValue: PersonType = person;
  keyofObjectType(property: keyof PersonType): (keyof PersonType)[] {
    type PersonKeys = keyof PersonType;
    let p1: PersonKeys = this.nameKey;
    let p2: keyof PersonType = 'age';
    return [p1, p2];
  }
  keyofWithTypeof(property1: keyof typeof person, property2: keyof typeof this.ageKey): keyof typeof this.returnValue {
    type PersonKeys = keyof typeof person;
    let p1: keyof typeof person = this.nameKey;
    return p1;
  }
}
`;

export const SourceAllKeyofObjectClassWithTypeOperator = `class AllKeyofObject {
  keyofPrimitiveType(): void {
    type A = keyof any;
    type B = keyof boolean;
    type C = keyof number;
    type D = keyof string;
    type E = keyof null;
    type F = keyof undefined;
    type G = keyof void;
    type H = keyof never;
  }
  keyofOtherTypes(): void {
    type ClassKeys = keyof BasicKeyof;
    type InterfaceKeys = keyof PersonInterface;
    type ArrayKeys = keyof string[];
    type TupleKeys = keyof [string, number];
    type EnumKeys = keyof typeof Color;
    type LiteralKeys = keyof {a: 1, b: 2};
    type A = {a: string};
    type B = {b: number};
    type UnionKeys = keyof (A | B);
  }
}
`;

export const SourceKeyofWithGenericClassWithTypeOperator = `class KeyofWithGeneric {
  private nameKey: keyof PersonGenericType<string, number> = 'name';
  private genericKey: keyof typeof GenericClass<number> = 'prototype';
  private referGenericKey: keyof typeof GenericClass<A> = 'prototype';
  keyofObjectType(property: keyof PersonGenericType<string, number>): (keyof PersonGenericType<string, number>)[] {
    type PersonKeys = keyof PersonGenericType<string, number>;
    let p1: PersonKeys = this.nameKey;
    let p2: keyof PersonGenericType<string, number> = 'age';
    return [p1, p2];
  }
  keyofWithTypeof(property1: keyof typeof personGeneric): keyof typeof personGeneric {
    type PersonKeys = keyof typeof personGeneric;
    let p1: keyof typeof personGeneric = this.nameKey;
    return p1;
  }
  typeofWithGeneric(property1: keyof typeof GenericClass<number>): keyof typeof GenericClass<number> {
    type PersonKeys = keyof typeof GenericClass<number>;
    let p1: keyof typeof GenericClass<number> = this.genericKey;
    return p1;
  }
  typeofWithReferGeneric(property1: keyof typeof GenericClass<A>): keyof typeof GenericClass<A> {
    type PersonKeys = keyof typeof GenericClass<A>;
    let p1: keyof typeof GenericClass<A> = this.genericKey;
    return p1;
  }
}
`;

export const SourceBigIntType = `class BigIntClass {
  private fieldA: bigint = 1n;
  fieldB: number & bigint;
  static fieldC: bigint | number;
  transfer2String(num: number | bigint): string | bigint {
    if (typeof(num) === 'bigint') {
      let a: bigint = 10n;
      const b: bigint = 100n;
      const c: bigint = this.fieldA + 100n;
      return ((a + b - c) * a) / b + num;
    }
    return num.toString();
  }
  testBitOperator(a: bigint, b: bigint): bigint {
    const c: bigint = a ^ b & a | b << 1n >> 2n;
    const aa: number = 123;
    const bb: number = 456;
    const cc: number = aa ^ bb & aa | bb << aa >> bb >>> aa;
    return c;
  }
}
type IntersectionType = string & bigint & void;
`;

export const IRBigIntType = `class %dflt {
  %dflt(): void {
    label0:
      this = this: @type/bigIntType.ts: %dflt
      type @type/bigIntType.ts: %dflt.[static]%dflt()#IntersectionType = string&bigint&void
      return
  }
}
class BigIntClass {
  private fieldA: bigint
  fieldB: number&bigint
  static fieldC: bigint|number

  %statInit(): void {
    label0:
      this = this: @type/bigIntType.ts: BigIntClass
      return
  }

  constructor(): @type/bigIntType.ts: BigIntClass {
    label0:
      this = this: @type/bigIntType.ts: BigIntClass
      instanceinvoke this.<@type/bigIntType.ts: BigIntClass.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @type/bigIntType.ts: BigIntClass
      this.<@type/bigIntType.ts: BigIntClass.fieldA> = 1
      return
  }

  transfer2String(num: number|bigint): string|bigint {
    label0:
      num = parameter0: number|bigint
      this = this: @type/bigIntType.ts: BigIntClass
      if typeof num === 'bigint' goto label1 label2

    label1:
      a = 10
      b = 100
      %0 = this.<@type/bigIntType.ts: BigIntClass.fieldA>
      c = %0 + 100
      %1 = a + b
      %2 = %1 - c
      %3 = %2 * a
      %4 = %3 / b
      %5 = %4 + num
      return %5

    label2:
      %6 = instanceinvoke num.<@%unk/%unk: .toString()>()
      return %6
  }

  testBitOperator(a: bigint, b: bigint): bigint {
    label0:
      a = parameter0: bigint
      b = parameter1: bigint
      this = this: @type/bigIntType.ts: BigIntClass
      %0 = b & a
      %1 = a ^ %0
      %2 = b << 1
      %3 = %2 >> 2
      c = %1 | %3
      aa = 123
      bb = 456
      %4 = bb & aa
      %5 = aa ^ %4
      %6 = bb << aa
      %7 = %6 >> bb
      %8 = %7 >>> aa
      cc = %5 | %8
      return c
  }
}
`;

export const SourceIROfObjectType = `class %dflt {
  foo(obj: @ES2015/BuiltinClass: Object): @ES2015/BuiltinClass: Object {
    label0:
      obj = parameter0: @ES2015/BuiltinClass: Object
      this = this: @type/objectType.ts: %dflt
      staticinvoke <@built-in/lib.es2015.core.d.ts: ObjectConstructor.keys(@built-in/lib.es2015.core.d.ts: %AC3)>(obj)
      instanceinvoke obj.<@built-in/lib.es5.d.ts: Object.toLocaleString()>()
      return obj
  }

  %dflt(): void {
    label0:
      this = this: @type/objectType.ts: %dflt
      %0 = new @ES2015/BuiltinClass: Object
      %0 = instanceinvoke %0.<@ES2015/BuiltinClass: Object.constructor()>()
      emptyObj = %0
      a = staticinvoke <@type/objectType.ts: %dflt.foo(@ES2015/BuiltinClass: Object)>(emptyObj)
      type @type/objectType.ts: %dflt.[static]%dflt()#newObject = @ES2015/BuiltinClass: Object
      %1 = @ES2015/BuiltinClass: Object.[static]prototype
      newEmptyObj = staticinvoke <@built-in/lib.es5.d.ts: ObjectConstructor.create(any)>(%1)
      b = staticinvoke <@type/objectType.ts: %dflt.foo(@ES2015/BuiltinClass: Object)>(newEmptyObj)
      return
  }
}
class ClassA {
  fieldA: @ES2015/BuiltinClass: Object

  %statInit(): void {
    label0:
      this = this: @type/objectType.ts: ClassA
      return
  }

  constructor(): @type/objectType.ts: ClassA {
    label0:
      this = this: @type/objectType.ts: ClassA
      instanceinvoke this.<@type/objectType.ts: ClassA.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @type/objectType.ts: ClassA
      %0 = new @type/objectType.ts: %AC0$ClassA.%instInit
      %0 = instanceinvoke %0.<@type/objectType.ts: %AC0$ClassA.%instInit.constructor()>()
      this.<@type/objectType.ts: ClassA.fieldA> = %0
      return
  }

  hasA(): string {
    label0:
      this = this: @type/objectType.ts: ClassA
      %0 = this.<@type/objectType.ts: ClassA.fieldA>
      %1 = instanceinvoke %0.<@built-in/lib.es5.d.ts: Object.toLocaleString()>()
      return %1
  }

  keys(): void {
    label0:
      this = this: @type/objectType.ts: ClassA
      %0 = this.<@type/objectType.ts: ClassA.fieldA>
      staticinvoke <@built-in/lib.es2015.core.d.ts: ObjectConstructor.keys(@built-in/lib.es2015.core.d.ts: %AC3)>(%0)
      return
  }
}
object %AC0$ClassA.%instInit {
  a: number

  constructor(): @type/objectType.ts: %AC0$ClassA.%instInit {
    label0:
      this = this: @type/objectType.ts: %AC0$ClassA.%instInit
      instanceinvoke this.<@type/objectType.ts: %AC0$ClassA.%instInit.%instInit()>()
      return this
  }

  %instInit(): void {
    label0:
      this = this: @type/objectType.ts: %AC0$ClassA.%instInit
      this.<@type/objectType.ts: %AC0$ClassA.%instInit.a> = 1
      return
  }
}
`;