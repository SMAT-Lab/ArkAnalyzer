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
    ANONYMOUS_METHOD_PREFIX,
    ArkStaticFieldRef,
    DEFAULT_ARK_CLASS_NAME,
    GlobalRef,
    LEXICAL_ENV_NAME_PREFIX,
    NAME_DELIMITER,
    NAME_PREFIX,
} from '../../../../src';

export const ArrowFunction_Expect_IR = {
    methods: [{
        name: '%dflt',
        stmts: [
            {
                text: 'this = this: @function/ArrowFunctionTest.ts: %dflt',
                operandOriginalPositions: [
                    null, null,
                ],
            },
            {
                text: 'func1 = %AM0',
                operandOriginalPositions: [
                    [16, 5, 16, 10], [16, 13, 16, 29],
                ],
            },
            {
                text: 'func2 = %AM1',
                operandOriginalPositions: [
                    [17, 5, 17, 10], [17, 13, 20, 2],
                ],
            },
            {
                text: 'func3 = %AM2',
                operandOriginalPositions: [
                    [21, 5, 21, 10], [21, 13, 21, 26],
                ],
            },
            {
                text: 'func4 = %AM3',
                operandOriginalPositions: [
                    [22, 5, 22, 10], [22, 13, 22, 31],
                ],
            },
            {
                text: 'return',
                operandOriginalPositions: [],
            },
        ],
    }, {
        name: '%AM0',
        stmts1: [
            'i = parameter0: number',
            'this = this: @function/ArrowFunctionTest.ts: %dflt',
            'return i',
        ],
        stmts: [
            {
                text: 'i = parameter0: number',
                operandOriginalPositions: [
                    [16, 14, 16, 15], [16, 14, 16, 15],
                ],
            },
            {
                text: 'this = this: @function/ArrowFunctionTest.ts: %dflt',
                operandOriginalPositions: [
                    null, null,
                ],
            },
            {
                text: 'return i',
                operandOriginalPositions: [
                    [16, 28, 16, 29],
                ],
            },
        ],
    }, {
        name: '%AM1',
        stmts1: [
            'this = this: @function/ArrowFunctionTest.ts: %dflt',
            'i = 0',
            'i = i + 1',
            'return',
        ],
        stmts: [
            {
                text: 'this = this: @function/ArrowFunctionTest.ts: %dflt',
                operandOriginalPositions: [
                    null, null,
                ],
            },
            {
                text: 'i = 0',
                operandOriginalPositions: [
                    [18, 9, 18, 10], [18, 13, 18, 14],
                ],
            },
            {
                text: 'i = i + 1',
                operandOriginalPositions: [
                    [19, 5, 19, 6], [19, 5, 19, 8], [19, 5, 19, 6], [-1, -1, -1, -1],
                ],
            },
            {
                text: 'return',
                operandOriginalPositions: [],
            },
        ],
    }, {
        name: '%AM2',
        stmts1: [
            'this = this: @function/ArrowFunctionTest.ts: %dflt',
            '%0 = ptrinvoke <@function/ArrowFunctionTest.ts: %dflt.func2()>()',
            'return %0',
        ],
        stmts: [
            {
                text: 'this = this: @function/ArrowFunctionTest.ts: %dflt',
                operandOriginalPositions: [
                    null, null,
                ],
            },
            {
                text: '%0 = ptrinvoke <@function/ArrowFunctionTest.ts: %dflt.func2()>()',
                operandOriginalPositions: [
                    [21, 19, 21, 26], [21, 19, 21, 26], [-1, -1, -1, -1]
                ],
            },
            {
                text: 'return %0',
                operandOriginalPositions: [
                    [21, 19, 21, 26],
                ],
            },
        ],
    }, {
        name: '%AM3',
        stmts1: [
            'i = parameter0: number',
            'this = this: @function/ArrowFunctionTest.ts: %dflt',
            'i = i + 1',
            'return i',
        ],
        stmts: [
            {
                text: 'i = parameter0: number',
                operandOriginalPositions: [
                    [22, 14, 22, 15], [22, 14, 22, 15],
                ],
            },
            {
                text: 'this = this: @function/ArrowFunctionTest.ts: %dflt',
                operandOriginalPositions: [
                    null, null,
                ],
            },
            {
                text: 'i = i + 1',
                operandOriginalPositions: [
                    [22, 28, 22, 29], [22, 28, 22, 31], [22, 28, 22, 29], [-1, -1, -1, -1],
                ],
            },
            {
                text: 'return i',
                operandOriginalPositions: [
                    [22, 28, 22, 29],
                ],
            },
        ],
    }],
};

export const OverloadMethod_Expect_IR = {
    methodDeclareLines: [16, 17],
    methodDeclareSignatures: [
        {
            toString: '@function/OverloadFunctionTest.ts: %dflt.overloadedFunction1(number)',
            methodSubSignature: {
                returnType: 'string'
            }
        },
        {
            toString: '@function/OverloadFunctionTest.ts: %dflt.overloadedFunction1(string)',
            methodSubSignature: {
                returnType: 'number'
            }
        }

    ],
    line: 18,
    methodSignature: {
        toString: '@function/OverloadFunctionTest.ts: %dflt.overloadedFunction1(any)',
        methodSubSignature: {
            returnType: 'any'
        }
    },
    body: {
        locals: [
            {
                name: 'x'
            }
        ]
    }
};

export const OverloadClassMethod_Expect_IR = {
    methodDeclareLines: [29, 30, 31],
    methodDeclareSignatures: [
        {
            toString: '@function/OverloadFunctionTest.ts: OverloadClass.overloadedFunction2(number, number)',
            methodSubSignature: {
                returnType: 'string'
            }
        },
        {
            toString: '@function/OverloadFunctionTest.ts: OverloadClass.overloadedFunction2(string, string)',
            methodSubSignature: {
                returnType: 'number'
            }
        },
        {
            toString: '@function/OverloadFunctionTest.ts: OverloadClass.overloadedFunction2(string, string)',
            methodSubSignature: {
                returnType: 'string'
            }
        }
    ],
    line: 33,
    methodSignature: {
        toString: '@function/OverloadFunctionTest.ts: OverloadClass.overloadedFunction2(number|string, number|string)',
        methodSubSignature: {
            returnType: 'string|number'
        }
    },
    body: {
        locals: [
            {
                name: 'x'
            }
        ]
    }
};

export const OverloadNamespaceMethod_Expect_IR = {
    methodDeclareLines: [45, 46, 47],
    methodDeclareSignatures: [
        {
            toString: '@function/OverloadFunctionTest.ts: overloadNamespace.%dflt.overloadedFunction3(number)',
            methodSubSignature: {
                returnType: 'string'
            }
        },
        {
            toString: '@function/OverloadFunctionTest.ts: overloadNamespace.%dflt.overloadedFunction3(string)',
            methodSubSignature: {
                returnType: 'number'
            }
        },
        {
            toString: '@function/OverloadFunctionTest.ts: overloadNamespace.%dflt.overloadedFunction3(string)',
            methodSubSignature: {
                returnType: 'boolean'
            }
        }
    ],
    line: null,
    methodSignature: null
};

export const OverloadInterfaceMethod_Expect_IR = {
    methodDeclareLines: [51, 52],
    methodDeclareSignatures: [
        {
            toString: '@function/OverloadFunctionTest.ts: OverloadInterface.overloadedFunction4(number)',
            methodSubSignature: {
                returnType: 'number'
            }
        },
        {
            toString: '@function/OverloadFunctionTest.ts: OverloadInterface.overloadedFunction4(string)',
            methodSubSignature: {
                returnType: 'string'
            }
        }
    ],
    line: null,
    methodSignature: null,
};

export const NoOverloadMethod_Expect_IR = {
    methodDeclareLines: [55],
    methodDeclareSignatures: [
        {
            toString: '@function/OverloadFunctionTest.ts: %dflt.function5(string)',
            methodSubSignature: {
                returnType: 'number'
            }
        }
    ],
    line: null,
    methodSignature: null
};

export const NoOverloadMethodWithBody_Expect_IR = {
    methodDeclareLines: [57],
    methodDeclareSignatures: [
        {
            toString: '@function/OverloadFunctionTest.ts: %dflt.function6(number)',
            methodSubSignature: {
                returnType: 'number'
            }
        }
    ],
    line: 58,
    methodSignature: {
        toString: '@function/OverloadFunctionTest.ts: %dflt.function6(number)',
        methodSubSignature: {
            returnType: 'number'
        }
    },
    body: {
        locals: [
            {
                name: 'x'
            }
        ]
    }
};

export const NoOverloadMethodWithBody2_Expect_IR = {
    methodDeclareLines: null,
    methodDeclareSignatures: null,
    line: 62,
    methodSignature: {
        toString: '@function/OverloadFunctionTest.ts: %dflt.function7(number)',
        methodSubSignature: {
            returnType: 'number'
        }
    },
    body: {
        locals: [
            {
                name: 'x'
            }
        ]
    }
};

export const BasicNestedMethod_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: BasicTest.basicMethod()'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.%nestedMethod$basicMethod()`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: 'nested',
                type: 'string',
                declaringStmt: {
                    text: `nested = 'abc'`
                },
                usedStmts: []
            }
        ]
    }
};

export const BasicOuterMethod_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.basicMethod()`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: 'outer',
                type: 'number',
                declaringStmt: {
                    text: `outer = 2`
                },
                usedStmts: []
            },
        ],
        globals: [
            {
                name: 'nestedMethod',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: BasicTest',
                    fieldName: '%nestedMethod$basicMethod',
                    type: '@function/ClosureParamsTest.ts: BasicTest.%nestedMethod$basicMethod()',
                },
                usedStmts: [
                    {
                        text: 'staticinvoke <@%unk/%unk: .nestedMethod()>()'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'this = this: @function/ClosureParamsTest.ts: BasicTest',
            },
            {
                text: 'outer = 2',
            },
            {
                text: 'staticinvoke <@%unk/%unk: .nestedMethod()>()',
            },
            {
                text: 'return',
            }
        ]
    }
};

export const BasicNestedMethod1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: BasicTest.basicOuterMethod1()'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.%basicNestedMethod1$basicOuterMethod1([output], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures0`,
                type: '[output]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [output]'
                },
                usedStmts: [
                    {
                        text: 'output = %closures0.output'
                    }
                ]
            },
            {
                name: 'output',
                type: 'number',
                declaringStmt: {
                    text: `output = %closures0.output`
                },
                usedStmts: [
                    {
                        text: '%0 = output + input'
                    }
                ]
            },
            {
                name: `input`,
                type: 'number',
                declaringStmt: {
                    text: 'input = parameter1: number'
                },
                usedStmts: [
                    {
                        text: '%0 = output + input'
                    }
                ]
            },
        ]
    }
};

export const BasicOuterMethod1_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.basicOuterMethod1()`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: 'output',
                type: 'number',
                declaringStmt: {
                    text: `output = 3`
                },
                usedStmts: []
            },
            {
                name: '%closures0',
                type: '[output]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: BasicTest.%basicNestedMethod1$basicOuterMethod1([output], number)>(%closures0, 2)'
                    }
                ]
            }
        ],
        globals: [
            {
                name: 'basicNestedMethod1',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: BasicTest',
                    fieldName: '%basicNestedMethod1$basicOuterMethod1',
                    type: 'closures: @function/ClosureParamsTest.ts: BasicTest.%basicNestedMethod1$basicOuterMethod1([output], number)',
                },
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: BasicTest.%basicNestedMethod1$basicOuterMethod1([output], number)>(%closures0, 2)'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'this = this: @function/ClosureParamsTest.ts: BasicTest',
            },
            {
                text: 'output = 3',
            },
            {
                text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: BasicTest.%basicNestedMethod1$basicOuterMethod1([output], number)>(%closures0, 2)',
            },
            {
                text: 'return %0',
            }
        ]
    }
};

export const BasicNestedMethod2_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: BasicTest.basicOuterMethod2(number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.%AM0$basicOuterMethod2([index], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures0',
                type: '[index]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [index]'
                },
                usedStmts: [
                    {
                        text: 'index = %closures0.index'
                    }
                ]
            },
            {
                name: 'index',
                type: 'number',
                declaringStmt: {
                    text: `index = %closures0.index`
                },
                usedStmts: [
                    {
                        text: '%0 = index + listener'
                    }
                ]
            },
            {
                name: 'listener',
                type: 'number',
                declaringStmt: {
                    text: `listener = parameter1: number`
                },
                usedStmts: [
                    {
                        text: '%0 = index + listener'
                    }
                ]
            }
        ],
        globals: [
            {
                name: 'console',
                type: 'unknown',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(%0)'
                    }
                ]
            }
        ]
    }
};

export const BasicOuterMethod2_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.basicOuterMethod2(number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures0`,
                type: '[index]',
                declaringStmt: null,
                usedStmts: []
            },
            {
                name: 'index',
                type: 'number',
                declaringStmt: {
                    text: `index = parameter0: number`
                },
                usedStmts: []
            },
            {
                name: '%AM0$basicOuterMethod2',
                type: 'closures: @function/ClosureParamsTest.ts: BasicTest.%AM0$basicOuterMethod2([index], number)',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'instanceinvoke %0.<@built-in/lib.es5.d.ts: Array.forEach(@built-in/lib.es5.d.ts: Array.%AM4(T, number, T[]), any)>(%AM0$basicOuterMethod2)'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'index = parameter0: number',
            },
            {
                text: 'this = this: @function/ClosureParamsTest.ts: BasicTest',
            },
            {
                text: '%0 = this.<@function/ClosureParamsTest.ts: BasicTest.listeners>',
            },
            {
                text: 'instanceinvoke %0.<@built-in/lib.es5.d.ts: Array.forEach(@built-in/lib.es5.d.ts: Array.%AM4(T, number, T[]), any)>(%AM0$basicOuterMethod2)',
            },
            {
                text: 'return',
            }
        ]
    }
};

export const BasicNestedMethod3_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: BasicTest.basicOuterMethod3(string)',
    },
    methodSignature: {
        toString: '@function/ClosureParamsTest.ts: BasicTest.%AM1$basicOuterMethod3([output])',
        methodSubSignature: {
            parameters: [
                {
                    name: '%closures0',
                    type: '[output]'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures0',
                type: '[output]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [output]'
                },
                usedStmts: [
                    {
                        text: `output = %closures0.output`
                    }
                ]
            },
            {
                name: 'output',
                type: 'string',
                declaringStmt: {
                    text: 'output = %closures0.output'
                },
            },
            {
                name: 'this',
                type: '@function/ClosureParamsTest.ts: BasicTest',
            }
        ],
        globals: [
            {
                name: 'console',
                type: 'unknown',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(output)'
                    }
                ]
            }
        ]
    }
};

export const BasicOuterMethod3_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: BasicTest.basicOuterMethod3(string)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures0`,
                type: '[output]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: BasicTest.basicNestedMethod3([output])>(%closures0)'
                    }
                ]
            },
            {
                name: 'output',
                type: 'string',
                declaringStmt: {
                    text: `output = parameter0: string`
                },
                usedStmts: []
            },
            {
                name: '%AM1$basicOuterMethod3',
                type: 'closures: @function/ClosureParamsTest.ts: BasicTest.%AM1$basicOuterMethod3([output])',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'basicNestedMethod3 = %AM1$basicOuterMethod3'
                    }
                ]
            },
            {
                name: 'basicNestedMethod3',
                type: 'closures: @function/ClosureParamsTest.ts: BasicTest.%AM1$basicOuterMethod3([output])',
                declaringStmt: {
                    text: 'basicNestedMethod3 = %AM1$basicOuterMethod3'
                },
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: BasicTest.basicNestedMethod3([output])>(%closures0)'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'output = parameter0: string',
            },
            {
                text: 'this = this: @function/ClosureParamsTest.ts: BasicTest',
            },
            {
                text: 'basicNestedMethod3 = %AM1$basicOuterMethod3',
            },
            {
                text: 'ptrinvoke <@function/ClosureParamsTest.ts: BasicTest.basicNestedMethod3([output])>(%closures0)',
            },
            {
                text: 'return',
            }
        ]
    }
};

export const BasicNestedMethod4_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: %dflt.basicOuterMethod4()',
    },
    methodSignature: {
        toString: '@function/ClosureParamsTest.ts: %dflt.%basicNestedMethod4$basicOuterMethod4([base], number)',
        methodSubSignature: {
            parameters: [
                {
                    name: '%closures0',
                    type: '[base]'
                },
                {
                    name: 'input',
                    type: 'number'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures0',
                type: '[base]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [base]'
                },
                usedStmts: [
                    {
                        text: `base = %closures0.base`
                    }
                ]
            },
            {
                name: 'base',
                type: 'number',
                declaringStmt: {
                    text: 'base = %closures0.base'
                },
            },
            {
                name: 'input',
                type: 'number',
                declaringStmt: {
                    text: 'input = parameter1: number'
                },
            }
        ]
    }
};

export const BasicOuterMethod4_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: %dflt.basicOuterMethod4()`,
        methodSubSignature: {
            returnType: 'closures: @function/ClosureParamsTest.ts: %dflt.%basicNestedMethod4$basicOuterMethod4([base], number)'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures0`,
                type: '[base]',
                declaringStmt: null,
                usedStmts: []
            },
            {
                name: 'base',
                type: 'number',
                declaringStmt: {
                    text: `base = 3`
                },
                usedStmts: []
            },
            {
                name: '%basicNestedMethod4$basicOuterMethod4',
                type: 'closures: @function/ClosureParamsTest.ts: %dflt.%basicNestedMethod4$basicOuterMethod4([base], number)',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'return %basicNestedMethod4$basicOuterMethod4'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'this = this: @function/ClosureParamsTest.ts: %dflt',
            },
            {
                text: 'base = 3',
            },
            {
                text: 'return %basicNestedMethod4$basicOuterMethod4',
            }
        ]
    }
};

export const CallMethod4_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: %dflt.callMethod4()`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: 'callMethod',
                type: 'closures: @function/ClosureParamsTest.ts: %dflt.%basicNestedMethod4$basicOuterMethod4([base], number)',
                declaringStmt: {
                    text: 'callMethod = staticinvoke <@function/ClosureParamsTest.ts: %dflt.basicOuterMethod4()>()'
                },
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: %dflt.callMethod([base], number)>(3)'
                    }
                ]
            }
        ],
        globals: [
            {
                name: 'basicOuterMethod4',
                instanceof: GlobalRef,
                ref: null,
                usedStmts: [
                    {
                        text: 'callMethod = staticinvoke <@function/ClosureParamsTest.ts: %dflt.basicOuterMethod4()>()'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'this = this: @function/ClosureParamsTest.ts: %dflt',
            },
            {
                text: 'callMethod = staticinvoke <@function/ClosureParamsTest.ts: %dflt.basicOuterMethod4()>()',
            },
            {
                text: 'ptrinvoke <@function/ClosureParamsTest.ts: %dflt.callMethod([base], number)>(3)',
            },
            {
                text: 'return',
            }
        ]
    }
};

export const UnClosureFunction_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.outerFunction1(number)`,
        methodSubSignature: {
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: 'this',
                type: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}`,
            },
            {
                name: 'outerInput',
                type: 'number',
            },
            {
                name: 'count',
                type: 'number',
            },
            {
                name: 'flag',
                type: 'number',
            },
            {
                name: 'innerFunction2',
                type: `closures: @function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.${ANONYMOUS_METHOD_PREFIX}1${NAME_DELIMITER}outerFunction1([outerInput])`,
                declaringStmt: {
                    text: `innerFunction2 = ${ANONYMOUS_METHOD_PREFIX}1${NAME_DELIMITER}outerFunction1`
                },
                usedStmts: [
                    {
                        text: `ptrinvoke <@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.innerFunction2([outerInput])>(${LEXICAL_ENV_NAME_PREFIX}1)`
                    }
                ]
            },
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                type: `[count, flag]`,
                usedStmts: [
                    {
                        text: `%0 = staticinvoke <@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction1${NAME_DELIMITER}outerFunction1([count, flag], string)>(${LEXICAL_ENV_NAME_PREFIX}0, \'abc\')`
                    }
                ]
            },
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}1`,
                type: `[outerInput]`,
                usedStmts: [
                    {
                        text: `ptrinvoke <@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.innerFunction2([outerInput])>(${LEXICAL_ENV_NAME_PREFIX}1)`
                    }
                ]
            }
        ],
        globals: [
            {
                name: `console`,
                type: 'unknown',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(%0)'
                    }
                ]
            },
            {
                name: `innerFunction1`,
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: %dflt',
                    fieldName: '%innerFunction1$outerFunction1',
                    type: `closures: @function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction1${NAME_DELIMITER}outerFunction1([count, flag], string)`,
                },
                usedStmts: [
                    {
                        text: `%0 = staticinvoke <@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction1${NAME_DELIMITER}outerFunction1([count, flag], string)>(${LEXICAL_ENV_NAME_PREFIX}0, \'abc\')`
                    }
                ]
            }
        ]
    }
};

export const ClosureFunction_Expect_IR = {
    outerMethod: {
        toString: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.outerFunction1(number)`,
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction1${NAME_DELIMITER}outerFunction1([count, flag], string)`,
        methodSubSignature: {
            parameters: [
                {
                    name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                    type: '[count, flag]'
                },
                {
                    name: 'innerInput',
                    type: 'string'
                }
            ],
            returnType: 'string'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                type: '[count, flag]',
                declaringStmt: {
                    text: `${LEXICAL_ENV_NAME_PREFIX}0 = parameter0: [count, flag]`
                },
                usedStmts: [
                    {
                        text: `count = ${LEXICAL_ENV_NAME_PREFIX}0.count`
                    },
                    {
                        text: `flag = ${LEXICAL_ENV_NAME_PREFIX}0.flag`
                    }
                ]
            },
            {
                name: 'count',
                type: 'number',
                declaringStmt: {
                    text: `count = ${LEXICAL_ENV_NAME_PREFIX}0.count`
                },
                usedStmts: [
                    {
                        text: 'count = count + 1'
                    }
                ]
            },
            {
                name: 'flag',
                type: 'number',
                declaringStmt: {
                    text: `flag = ${LEXICAL_ENV_NAME_PREFIX}0.flag`
                },
                usedStmts: [
                    {
                        text: 'if flag == 1'
                    },
                    {
                        text: 'if flag == 2'
                    }
                ]
            },
            {
                name: 'innerInput',
                type: 'string',
                declaringStmt: {
                    text: 'innerInput = parameter1: string'
                },
            },
            {
                name: 'this',
                type: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}`,
            },
            {
                name: 'result',
                type: 'string',
            },
        ],
        globals: undefined
    }
};

export const ClosureAnonymousFunction_Expect_IR = {
    outerMethod: {
        toString: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.outerFunction1(number)`,
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}.${ANONYMOUS_METHOD_PREFIX}1${NAME_DELIMITER}outerFunction1([outerInput])`,
        methodSubSignature: {
            parameters: [
                {
                    name: `${LEXICAL_ENV_NAME_PREFIX}1`,
                    type: '[outerInput]'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}1`,
                type: '[outerInput]',
                declaringStmt: {
                    text: `${LEXICAL_ENV_NAME_PREFIX}1 = parameter0: [outerInput]`
                },
                usedStmts: [
                    {
                        text: `outerInput = ${LEXICAL_ENV_NAME_PREFIX}1.outerInput`
                    }
                ]
            },
            {
                name: 'outerInput',
                type: 'number',
                declaringStmt: {
                    text: `outerInput = ${LEXICAL_ENV_NAME_PREFIX}1.outerInput`
                },
            },
            {
                name: 'this',
                type: `@function/ClosureParamsTest.ts: ${DEFAULT_ARK_CLASS_NAME}`,
            }
        ],
        globals: [
            {
                name: 'console',
                type: 'unknown',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(outerInput)'
                    }
                ]
            }
        ]
    }
};

export const ClosureClassMethod_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: ClosureClass.outerFunction2(number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: ClosureClass.${NAME_PREFIX}innerFunction2${NAME_DELIMITER}outerFunction2([count, nums], string)`,
        methodSubSignature: {
            parameters: [
                {
                    name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                    type: '[count, nums]'
                },
                {
                    name: 'outerInput',
                    type: 'string'
                }
            ],
            returnType: 'string'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                type: '[count, nums]',
                declaringStmt: {
                    text: `${LEXICAL_ENV_NAME_PREFIX}0 = parameter0: [count, nums]`
                },
                usedStmts: [
                    {
                        text: `count = ${LEXICAL_ENV_NAME_PREFIX}0.count`
                    },
                    {
                        text: `nums = ${LEXICAL_ENV_NAME_PREFIX}0.nums`
                    },
                ]
            },
            {
                name: 'count',
                type: 'string',
                declaringStmt: {
                    text: `count = ${LEXICAL_ENV_NAME_PREFIX}0.count`
                },
                usedStmts: [
                    {
                        text: 'count = count + outerInput'
                    },
                    {
                        text: 'count = count + item'
                    },
                    {
                        text: '%5 = instanceinvoke count.<@built-in/lib.es5.d.ts: String.toString()>()'
                    }
                ]
            },
            {
                name: 'nums',
                type: 'number[]',
                declaringStmt: {
                    text: `nums = ${LEXICAL_ENV_NAME_PREFIX}0.nums`
                },
                usedStmts: [
                    {
                        text: '%0 = instanceinvoke nums.<@built-in/lib.es2015.iterable.d.ts: Array.Symbol.iterator()>()'
                    }
                ]
            },
            {
                name: 'outerInput',
                type: 'string',
                declaringStmt: {
                    text: 'outerInput = parameter1: string'
                }
            },
            {
                name: 'this',
                type: '@function/ClosureParamsTest.ts: ClosureClass',
            },
            {
                name: 'item',
                type: 'number',
            }
        ],
    }
};

export const ClosureNamespaceFunction_Expect_IR = {
    outerMethod: {
        toString: `@function/ClosureParamsTest.ts: closureNamespace.${DEFAULT_ARK_CLASS_NAME}.outerFunction3(number)`
    },
    methodDeclareSignatures: [
        {
            toString: `@function/ClosureParamsTest.ts: closureNamespace.${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction3${NAME_DELIMITER}outerFunction3([count, size, outerInput])`,
            methodSubSignature: {
                returnType: 'string'
            }
        },
        {
            toString: `@function/ClosureParamsTest.ts: closureNamespace.${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction3${NAME_DELIMITER}outerFunction3([count, size, outerInput], string)`,
            methodSubSignature: {
                returnType: 'string'
            }
        }

    ],
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: closureNamespace.${DEFAULT_ARK_CLASS_NAME}.${NAME_PREFIX}innerFunction3${NAME_DELIMITER}outerFunction3([count, size, outerInput], string)`,
        methodSubSignature: {
            parameters: [
                {
                    name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                    type: '[count, size, outerInput]'
                },
                {
                    name: 'innerInput',
                    type: 'string'
                }
            ],
            returnType: 'string'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                type: '[count, size, outerInput]',
                declaringStmt: {
                    text: `${LEXICAL_ENV_NAME_PREFIX}0 = parameter0: [count, size, outerInput]`
                },
                usedStmts: [
                    {
                        text: `count = ${LEXICAL_ENV_NAME_PREFIX}0.count`
                    },
                    {
                        text: `size = ${LEXICAL_ENV_NAME_PREFIX}0.size`
                    },
                    {
                        text: `outerInput = ${LEXICAL_ENV_NAME_PREFIX}0.outerInput`
                    }
                ]
            },
            {
                name: 'count',
                type: 'number',
                declaringStmt: {
                    text: `count = ${LEXICAL_ENV_NAME_PREFIX}0.count`
                },
                usedStmts: [
                    {
                        text: '%0 = count + size'
                    }
                ]
            },
            {
                name: 'size',
                type: 'number',
                declaringStmt: {
                    text: `size = ${LEXICAL_ENV_NAME_PREFIX}0.size`
                },
                usedStmts: [
                    {
                        text: '%0 = count + size'
                    }
                ]
            },
            {
                name: 'outerInput',
                type: 'number',
                declaringStmt: {
                    text: `outerInput = ${LEXICAL_ENV_NAME_PREFIX}0.outerInput`
                },
                usedStmts: [
                    {
                        text: '%1 = instanceinvoke outerInput.<@built-in/lib.es5.d.ts: Number.toString(number)>()'
                    }
                ]
            },
            {
                name: 'innerInput',
                type: 'string',
                declaringStmt: {
                    text: 'innerInput = parameter1: string'
                },
                usedStmts: []
            },
            {
                name: 'this',
                type: `@function/ClosureParamsTest.ts: closureNamespace.${DEFAULT_ARK_CLASS_NAME}`,
            },
            {
                name: 'res',
                type: 'number',
            }
        ],
        globals: [
            {
                name: 'globalValue',
                type: 'number',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'res = %0 + globalValue'
                    }
                ]
            }
        ]
    }
};

export const ClosureNamespaceClassMethod_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: closureNamespace.ClosureClass.outerFunction3(number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: closureNamespace.ClosureClass.${NAME_PREFIX}innerFunction3${NAME_DELIMITER}outerFunction3([flag, outerInput])`,
        methodSubSignature: {
            parameters: [
                {
                    name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                    type: '[flag, outerInput]'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `${LEXICAL_ENV_NAME_PREFIX}0`,
                type: '[flag, outerInput]',
                declaringStmt: {
                    text: `${LEXICAL_ENV_NAME_PREFIX}0 = parameter0: [flag, outerInput]`
                },
                usedStmts: [
                    {
                        text: `flag = ${LEXICAL_ENV_NAME_PREFIX}0.flag`
                    },
                    {
                        text: `outerInput = ${LEXICAL_ENV_NAME_PREFIX}0.outerInput`
                    }
                ]
            },
            {
                name: 'flag',
                type: 'boolean',
                declaringStmt: {
                    text: `flag = ${LEXICAL_ENV_NAME_PREFIX}0.flag`
                },
                usedStmts: [
                    {
                        text: '%0 = !flag',
                    }
                ]
            },
            {
                name: 'outerInput',
                type: 'number',
                declaringStmt: {
                    text: `outerInput = ${LEXICAL_ENV_NAME_PREFIX}0.outerInput`
                },
                usedStmts: [
                    {
                        text: 'if outerInput > 0'
                    },
                    {
                        text: 'outerInput = outerInput - 1'
                    }
                ]
            },
            {
                name: 'this',
                type: '@function/ClosureParamsTest.ts: closureNamespace.ClosureClass'
            },
            {
                name: `error`,
                type: 'unknown',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(error)'
                    }
                ]
            }
        ],
        globals: [
            {
                name: `console`,
                type: 'unknown',
                instanceof: GlobalRef,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(error)'
                    }
                ]
            },
        ]
    }
};

export const MultipleOuterMethod1_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod1(string)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `x`,
                type: 'string',
                declaringStmt: {
                    text: 'x = parameter0: string'
                },
                usedStmts: []
            },
            {
                name: 'a',
                type: 'number',
                declaringStmt: {
                    text: `a = 3`
                },
                usedStmts: []
            },
            {
                name: 'b',
                type: 'string',
                declaringStmt: {
                    text: `b = 'xyz'`
                },
                usedStmts: []
            },
            {
                name: '%closures0',
                type: '[a]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested1Method1$outerMethod1([a], number)>(%closures0, 2)'
                    }
                ]
            },
            {
                name: '%closures3',
                type: '[x]',
                declaringStmt: null,
                usedStmts: []
            }
        ],
        globals: [
            {
                name: 'nested1Method1',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: MultipleNestedTest',
                    fieldName: '%nested1Method1$outerMethod1',
                    type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nested1Method1$outerMethod1([a], number)',
                },
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested1Method1$outerMethod1([a], number)>(%closures0, 2)'
                    }
                ]
            }
        ],
        stmts: [
            {
                text: 'x = parameter0: string',
            },
            {
                text: 'this = this: @function/ClosureParamsTest.ts: MultipleNestedTest',
            },
            {
                text: 'a = 3',
            },
            {
                text: `b = 'xyz'`,
            },
            {
                text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested1Method1$outerMethod1([a], number)>(%closures0, 2)',
            },
            {
                text: 'return %0',
            }
        ]
    }
};

export const MultipleNested1Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod1(string)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested1Method1$outerMethod1([a], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures0`,
                type: '[a]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [a]'
                },
                usedStmts: [
                    {
                        text: 'a = %closures0.a'
                    }
                ]
            },
            {
                name: `a`,
                type: 'number',
                declaringStmt: {
                    text: 'a = %closures0.a'
                },
                usedStmts: []
            },
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = parameter1: number'
                },
                usedStmts: []
            },
            {
                name: `c`,
                type: 'string',
                declaringStmt: {
                    text: `c = 'xyz'`
                },
                usedStmts: []
            },
            {
                name: `%closures1`,
                type: '[a, b]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested2Method1$%nested1Method1$outerMethod1([a, b], number)>(%closures1, 1)'
                    }
                ]
            },
        ],
        globals: [
            {
                name: 'nested2Method1',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: MultipleNestedTest',
                    fieldName: '%nested2Method1$%nested1Method1$outerMethod1',
                    type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nested2Method1$%nested1Method1$outerMethod1([a, b], number)',
                },
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested2Method1$%nested1Method1$outerMethod1([a, b], number)>(%closures1, 1)'
                    }
                ]
            }
        ],
    }
};

export const MultipleNested2Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nested1Method1$outerMethod1([a], number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested2Method1$%nested1Method1$outerMethod1([a, b], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures1`,
                type: '[a, b]',
                declaringStmt: {
                    text: '%closures1 = parameter0: [a, b]'
                },
                usedStmts: [
                    {
                        text: 'a = %closures1.a'
                    },
                    {
                        text: 'b = %closures1.b'
                    }
                ]
            },
            {
                name: `a`,
                type: 'number',
                declaringStmt: {
                    text: 'a = %closures1.a'
                },
                usedStmts: []
            },
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = %closures1.b'
                },
                usedStmts: []
            },
            {
                name: `c`,
                type: 'number',
                declaringStmt: {
                    text: 'c = parameter1: number'
                },
                usedStmts: []
            },
            {
                name: `%closures2`,
                type: '[a, b, c]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1([a, b, c])>(%closures2)'
                    }
                ]
            },
        ],
        globals: [
            {
                name: 'nested3Method1',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: MultipleNestedTest',
                    fieldName: '%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1',
                    type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1([a, b, c])',
                },
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1([a, b, c])>(%closures2)'
                    }
                ]
            }
        ],
    }
};

export const MultipleNested3Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nested2Method1$%nested1Method1$outerMethod1([a, b], number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested3Method1$%nested2Method1$%nested1Method1$outerMethod1([a, b, c])`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures2`,
                type: '[a, b, c]',
                declaringStmt: {
                    text: '%closures2 = parameter0: [a, b, c]'
                },
                usedStmts: [
                    {
                        text: 'a = %closures2.a'
                    },
                    {
                        text: 'b = %closures2.b'
                    },
                    {
                        text: 'c = %closures2.c'
                    }
                ]
            },
            {
                name: `a`,
                type: 'number',
                declaringStmt: {
                    text: 'a = %closures2.a'
                },
                usedStmts: [
                    {
                        text: '%0 = a + b'
                    }
                ]
            },
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = %closures2.b'
                },
                usedStmts: [
                    {
                        text: '%0 = a + b'
                    }
                ]
            },
            {
                name: `c`,
                type: 'number',
                declaringStmt: {
                    text: 'c = %closures2.c'
                },
                usedStmts: [
                    {
                        text: '%1 = %0 + c'
                    }
                ]
            },
        ],
        globals: undefined
    }
};

export const MultipleNested11Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod1(string)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested11Method1$outerMethod1([x], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures3`,
                type: '[x]',
                declaringStmt: {
                    text: '%closures3 = parameter0: [x]'
                },
                usedStmts: [
                    {
                        text: 'x = %closures3.x'
                    }
                ]
            },
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = parameter1: number'
                },
                usedStmts: []
            },
            {
                name: `c`,
                type: 'string',
                declaringStmt: {
                    text: `c = 'xyz'`
                },
                usedStmts: []
            },
            {
                name: `%closures4`,
                type: '[b]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested22Method1$%nested11Method1$outerMethod1([b], number)>(%closures4, 1)'
                    }
                ]
            },
            {
                name: `%closures5`,
                type: '[x]',
                declaringStmt: null,
                usedStmts: []
            },
        ],
        globals: [
            {
                name: 'nested22Method1',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: MultipleNestedTest',
                    fieldName: '%nested22Method1$%nested11Method1$outerMethod1',
                    type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nested22Method1$%nested11Method1$outerMethod1([b], number)',
                },
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested22Method1$%nested11Method1$outerMethod1([b], number)>(%closures4, 1)'
                    }
                ]
            }
        ],
    }
};

export const MultipleNested22Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nested11Method1$outerMethod1([x], number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested22Method1$%nested11Method1$outerMethod1([b], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures4`,
                type: '[b]',
                declaringStmt: {
                    text: '%closures4 = parameter0: [b]'
                },
                usedStmts: [
                    {
                        text: 'b = %closures4.b'
                    }
                ]
            },
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = %closures4.b'
                },
                usedStmts: [
                    {
                        text: '%0 = b + c'
                    }
                ]
            },
            {
                name: `c`,
                type: 'number',
                declaringStmt: {
                    text: 'c = parameter1: number'
                },
                usedStmts: [
                    {
                        text: '%0 = b + c'
                    }
                ]
            },
        ],
        globals: undefined
    }
};

export const MultipleNested33Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nested11Method1$outerMethod1([x], number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested33Method1$%nested11Method1$outerMethod1([x])`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures5`,
                type: '[x]',
                declaringStmt: {
                    text: '%closures5 = parameter0: [x]'
                },
                usedStmts: [
                    {
                        text: 'x = %closures5.x'
                    }
                ]
            },
            {
                name: `x`,
                type: 'string',
                declaringStmt: {
                    text: 'x = %closures5.x'
                },
                usedStmts: [
                    {
                        text: 'return x'
                    }
                ]
            },
        ],
        globals: undefined
    }
};

export const MultipleNested111Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod1(string)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested111Method1$outerMethod1(number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = parameter0: number'
                },
                usedStmts: []
            },
            {
                name: `c`,
                type: 'string',
                declaringStmt: {
                    text: `c = 'xyz'`
                },
                usedStmts: []
            },
            {
                name: `%closures6`,
                type: '[b]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested222Method1$%nested111Method1$outerMethod1([b], number)>(%closures6, 1)'
                    }
                ]
            }
        ],
        globals: [
            {
                name: 'nested222Method1',
                instanceof: GlobalRef,
                ref: {
                    instanceof: ArkStaticFieldRef,
                    declaringSignature: '@function/ClosureParamsTest.ts: MultipleNestedTest',
                    fieldName: '%nested222Method1$%nested111Method1$outerMethod1',
                    type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nested222Method1$%nested111Method1$outerMethod1([b], number)',
                },
                usedStmts: [
                    {
                        text: '%0 = staticinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.%nested222Method1$%nested111Method1$outerMethod1([b], number)>(%closures6, 1)'
                    }
                ]
            }
        ],
    }
};

export const MultipleNested222Method1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nested111Method1$outerMethod1(number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%nested222Method1$%nested111Method1$outerMethod1([b], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `%closures6`,
                type: '[b]',
                declaringStmt: {
                    text: '%closures6 = parameter0: [b]'
                },
                usedStmts: [
                    {
                        text: 'b = %closures6.b'
                    }
                ]
            },
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = %closures6.b'
                },
                usedStmts: [
                    {
                        text: '%0 = b + c'
                    }
                ]
            },
            {
                name: `c`,
                type: 'number',
                declaringStmt: {
                    text: 'c = parameter1: number'
                },
                usedStmts: [
                    {
                        text: '%0 = b + c'
                    }
                ]
            },
        ],
        globals: undefined
    }
};

export const MultipleOuterMethod2_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod2(number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `a`,
                type: 'number',
                declaringStmt: {
                    text: 'a = parameter0: number'
                },
                usedStmts: []
            },
            {
                name: 'x',
                type: 'number',
                declaringStmt: {
                    text: `x = 123`
                },
                usedStmts: []
            },
            {
                name: '%closures0',
                type: '[a]',
                declaringStmt: null,
                usedStmts: []
            },
            {
                name: '%AM1$outerMethod2',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%AM1$outerMethod2([a], number[])',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'instanceinvoke %0.<@built-in/lib.es5.d.ts: Array.forEach(@built-in/lib.es5.d.ts: Array.%AM4(T, number, T[]), any)>(%AM1$outerMethod2)'
                    }
                ]
            }
        ],
        globals: null,
        stmts: [
            {
                text: 'a = parameter0: number',
            },
            {
                text: 'this = this: @function/ClosureParamsTest.ts: MultipleNestedTest',
            },
            {
                text: 'x = 123',
            },
            {
                text: '%0 = this.<@function/ClosureParamsTest.ts: MultipleNestedTest.listeners>',
            },
            {
                text: 'instanceinvoke %0.<@built-in/lib.es5.d.ts: Array.forEach(@built-in/lib.es5.d.ts: Array.%AM4(T, number, T[]), any)>(%AM1$outerMethod2)',
            },
            {
                text: 'return',
            }
        ]
    }
};

export const MultipleAnonymousMethod1_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod2(number)'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%AM1$outerMethod2([a], number[])`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures0',
                type: '[a]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [a]'
                },
                usedStmts: [
                    {
                        text: 'a = %closures0.a'
                    }
                ]
            },
            {
                name: 'a',
                type: 'number',
                declaringStmt: {
                    text: `a = %closures0.a`
                },
                usedStmts: []
            },
            {
                name: 'listener',
                type: 'number[]',
                declaringStmt: {
                    text: 'listener = parameter1: number[]'
                },
                usedStmts: [
                    {
                        text: 'instanceinvoke listener.<@built-in/lib.es5.d.ts: Array.forEach(@built-in/lib.es5.d.ts: Array.%AM4(T, number, T[]), any)>(%AM2$%AM1$outerMethod2)'
                    }
                ]
            },
            {
                name: '%closures1',
                type: '[a, listener]',
                declaringStmt: undefined,
                usedStmts: []
            },
            {
                name: '%AM2$%AM1$outerMethod2',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%AM2$%AM1$outerMethod2([a, listener], number)',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'instanceinvoke listener.<@built-in/lib.es5.d.ts: Array.forEach(@built-in/lib.es5.d.ts: Array.%AM4(T, number, T[]), any)>(%AM2$%AM1$outerMethod2)'
                    }
                ]
            }
        ],
        globals: null
    }
};

export const MultipleAnonymousMethod2_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%AM1$outerMethod2([a], number[])'
    },
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.%AM2$%AM1$outerMethod2([a, listener], number)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures1',
                type: '[a, listener]',
                declaringStmt: {
                    text: '%closures1 = parameter0: [a, listener]'
                },
                usedStmts: [
                    {
                        text: 'a = %closures1.a'
                    },
                    {
                        text: 'listener = %closures1.listener'
                    }
                ]
            },
            {
                name: 'a',
                type: 'number',
                declaringStmt: {
                    text: 'a = %closures1.a'
                },
                usedStmts: [
                    {
                        text: '%0 = a + item'
                    }
                ]
            },
            {
                name: 'listener',
                type: 'number[]',
                declaringStmt: {
                    text: 'listener = %closures1.listener'
                },
                usedStmts: [
                    {
                        text: '%1 = listener.<@built-in/lib.es5.d.ts: Array.length>'
                    }
                ]
            },
            {
                name: 'item',
                type: 'number',
                declaringStmt: {
                    text: 'item = parameter1: number'
                },
                usedStmts: [
                    {
                        text: '%0 = a + item'
                    }
                ]
            },
        ],
        globals: [
            {
                name: 'console',
                instanceof: GlobalRef,
                ref: null,
                usedStmts: [
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(%0)'
                    },
                    {
                        text: 'instanceinvoke console.<@%unk/%unk: .log()>(%1)'
                    }
                ]
            }
        ]
    }
};

export const MultipleOuterMethod3_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod3(string)`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `a`,
                type: 'string',
                declaringStmt: {
                    text: 'a = parameter0: string'
                },
                usedStmts: []
            },
            {
                name: '%closures0',
                type: '[a]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.nestedMethod3([a])>(%closures0)'
                    }
                ]
            },
            {
                name: '%AM3$outerMethod3',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%AM3$outerMethod3([a])',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'nestedMethod3 = %AM3$outerMethod3'
                    }
                ]
            },
            {
                name: 'nestedMethod3',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%AM3$outerMethod3([a])',
                declaringStmt: {
                    text: 'nestedMethod3 = %AM3$outerMethod3'
                },
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.nestedMethod3([a])>(%closures0)'
                    }
                ]
            }
        ],
        globals: null,
        stmts: [
            {
                text: 'a = parameter0: string',
            },
            {
                text: 'this = this: @function/ClosureParamsTest.ts: MultipleNestedTest',
            },
            {
                text: 'nestedMethod3 = %AM3$outerMethod3',
            },
            {
                text: 'ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.nestedMethod3([a])>(%closures0)',
            },
            {
                text: 'return',
            }
        ]
    }
};

export const MultipleAnonymousMethod3_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod3(string)',
    },
    methodSignature: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%AM3$outerMethod3([a])',
        methodSubSignature: {
            parameters: [
                {
                    name: '%closures0',
                    type: '[a]'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures0',
                type: '[a]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [a]'
                },
                usedStmts: [
                    {
                        text: `a = %closures0.a`
                    }
                ]
            },
            {
                name: 'a',
                type: 'string',
                declaringStmt: {
                    text: 'a = %closures0.a'
                },
            },
            {
                name: 'this',
                type: '@function/ClosureParamsTest.ts: MultipleNestedTest',
            },
            {
                name: 'b',
                type: 'string',
                declaringStmt: {
                    text: `b = 'abc'`
                },
            },
            {
                name: 'x',
                type: 'number',
                declaringStmt: {
                    text: `x = 123`
                },
            },
            {
                name: '%closures1',
                type: '[a, b]',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: `ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.nestedInNestedMethod3([a, b])>(%closures1)`
                    }
                ]
            },
            {
                name: 'nestedInNestedMethod3',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%AM4$%AM3$outerMethod3([a, b])',
                declaringStmt: {
                    text: 'nestedInNestedMethod3 = %AM4$%AM3$outerMethod3'
                },
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.nestedInNestedMethod3([a, b])>(%closures1)'
                    }
                ]
            }
        ],
        globals: undefined
    }
};

export const MultipleAnonymousMethod4_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%AM3$outerMethod3([a])',
    },
    methodSignature: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%AM4$%AM3$outerMethod3([a, b])',
        methodSubSignature: {
            parameters: [
                {
                    name: '%closures1',
                    type: '[a, b]'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures1',
                type: '[a, b]',
                declaringStmt: {
                    text: '%closures1 = parameter0: [a, b]'
                },
                usedStmts: [
                    {
                        text: `a = %closures1.a`
                    },
                    {
                        text: `b = %closures1.b`
                    }
                ]
            },
            {
                name: 'a',
                type: 'string',
                declaringStmt: {
                    text: 'a = %closures1.a'
                },
                usedStmts: [
                    {
                        text: `%0 = a + b`
                    }
                ]
            },
            {
                name: 'b',
                type: 'string',
                declaringStmt: {
                    text: `b = %closures1.b`
                },
                usedStmts: [
                    {
                        text: `%0 = a + b`
                    }
                ]
            },
            {
                name: 'this',
                type: '@function/ClosureParamsTest.ts: MultipleNestedTest',
            },
        ],
        globals:{
            name: 'console',
            instanceof: GlobalRef,
            ref: null,
            usedStmts: [
                {
                    text: 'instanceinvoke console.<@%unk/%unk: .log()>(%0)'
                }
            ]
        }
    }
};

export const MultipleOuterMethod4_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod4()`,
        methodSubSignature: {
            returnType: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nestedMethod4$outerMethod4([b], number)'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: `b`,
                type: 'number',
                declaringStmt: {
                    text: 'b = 3'
                },
                usedStmts: []
            },
            {
                name: '%closures0',
                type: '[b]',
                declaringStmt: null,
                usedStmts: []
            },
            {
                name: '%nestedMethod4$outerMethod4',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nestedMethod4$outerMethod4([b], number)',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'return %nestedMethod4$outerMethod4'
                    }
                ]
            },
        ],
        globals: null,
        stmts: [
            {
                text: 'this = this: @function/ClosureParamsTest.ts: MultipleNestedTest',
            },
            {
                text: 'b = 3',
            },
            {
                text: 'return %nestedMethod4$outerMethod4',
            }
        ]
    }
};

export const MultipleNestedMethod4_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod4()',
    },
    methodSignature: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nestedMethod4$outerMethod4([b], number)',
        methodSubSignature: {
            parameters: [
                {
                    name: '%closures0',
                    type: '[b]'
                },
                {
                    name: 'a',
                    type: 'number'
                }
            ],
            returnType: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nestedInNestedMethod4$%nestedMethod4$outerMethod4([a, b])'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures0',
                type: '[b]',
                declaringStmt: {
                    text: '%closures0 = parameter0: [b]'
                },
                usedStmts: [
                    {
                        text: `b = %closures0.b`
                    }
                ]
            },
            {
                name: 'b',
                type: 'number',
                declaringStmt: {
                    text: 'b = %closures0.b'
                },
            },
            {
                name: 'a',
                type: 'number',
                declaringStmt: {
                    text: 'a = parameter1: number'
                },
            },
            {
                name: '%closures1',
                type: '[a, b]',
                declaringStmt: null,
                usedStmts: []
            },
            {
                name: '%nestedInNestedMethod4$%nestedMethod4$outerMethod4',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nestedInNestedMethod4$%nestedMethod4$outerMethod4([a, b])',
                declaringStmt: null,
                usedStmts: [
                    {
                        text: 'return %nestedInNestedMethod4$%nestedMethod4$outerMethod4'
                    }
                ]
            },
        ]
    }
};

export const MultipleNestedInNestedMethod4_Expect_IR = {
    outerMethod: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nestedMethod4$outerMethod4([b], number)',
    },
    methodSignature: {
        toString: '@function/ClosureParamsTest.ts: MultipleNestedTest.%nestedInNestedMethod4$%nestedMethod4$outerMethod4([a, b])',
        methodSubSignature: {
            parameters: [
                {
                    name: '%closures1',
                    type: '[a, b]'
                }
            ],
            returnType: 'void'
        }
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: '%closures1',
                type: '[a, b]',
                declaringStmt: {
                    text: '%closures1 = parameter0: [a, b]'
                },
                usedStmts: [
                    {
                        text: `a = %closures1.a`
                    },
                    {
                        text: `b = %closures1.b`
                    }
                ]
            },
            {
                name: 'a',
                type: 'number',
                declaringStmt: {
                    text: 'a = %closures1.a'
                },
                usedStmts: [
                    {
                        text: 'a = a + b'
                    }
                ]
            },
            {
                name: 'b',
                type: 'number',
                declaringStmt: {
                    text: 'b = %closures1.b'
                },
                usedStmts: [
                    {
                        text: 'a = a + b'
                    }
                ]
            }
        ]
    }
};

export const MultipleCallMethod4_Expect_IR = {
    outerMethod: undefined,
    methodSignature: {
        toString: `@function/ClosureParamsTest.ts: MultipleNestedTest.callMethod4()`,
    },
    bodyBuilder: undefined,
    body: {
        locals: [
            {
                name: 'callMethod',
                type: 'closures: @function/ClosureParamsTest.ts: MultipleNestedTest.%nestedMethod4$outerMethod4([b], number)',
                declaringStmt: {
                    text: 'callMethod = instanceinvoke this.<@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod4()>()'
                },
                usedStmts: [
                    {
                        text: 'ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.callMethod([b], number)>(3)'
                    }
                ]
            }
        ],
        globals: undefined,
        stmts: [
            {
                text: 'this = this: @function/ClosureParamsTest.ts: MultipleNestedTest',
            },
            {
                text: 'callMethod = instanceinvoke this.<@function/ClosureParamsTest.ts: MultipleNestedTest.outerMethod4()>()'
            },
            {
                text: 'ptrinvoke <@function/ClosureParamsTest.ts: MultipleNestedTest.callMethod([b], number)>(3)'
            },
            {
                text: 'return',
            }
        ]
    }
};
