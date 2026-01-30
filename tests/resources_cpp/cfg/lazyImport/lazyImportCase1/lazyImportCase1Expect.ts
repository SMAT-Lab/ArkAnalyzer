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

export const LAZY_IMPORT_CASE1_CLASS = {
    fields: ['value_', 'env_', 'wrapper_', 'instance_'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'Init',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: struct napi_env__*',
                        'exports = parameter1: struct napi_value__*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        '%0 = AggregateExpr(\'value\',0,0,GetValue,SetValue,0,@%unk/%unk: napi_property_attributes.[static]napi_default,0)',
                        '%1 = AggregateExpr(\'plusOne\',null,PlusOne,null,null,null,@%unk/%unk: napi_property_attributes.[static]napi_default,null)',
                        '%2 = newarray (napi_property_descriptor[0])',
                        '%2[0] = %0',
                        '%2[1] = %1',
                        'properties = %2',
                        'cons = undefined',
                        '%3 = &cons',
                        'staticinvoke <@%unk/%unk: .napi_define_class()>(env, \'GlobalConfig\', 18446744073709551615, New, null, 2, properties, %3)',
                        '%4 = &g_ref',
                        'staticinvoke <@%unk/%unk: .napi_create_reference()>(env, cons, 1, %4)',
                        'staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, exports, \'GlobalConfig\', cons)',
                        'return exports',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'Destructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: struct napi_env__*',
                        'nativeObject = parameter1: void*',
                        'finalizeHint = parameter2: void*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        '%0 = delete <CXXReinterpretCastExpr: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig*>nativeObject',
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'value = parameter0: double',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'instanceinvoke this.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.%instInit()>()',
                        'if value == undefined',
                    ],
                    preds: [],
                    succes: [1, 2],
                },
                { id: 1, stmts: ['value = 0'], preds: [0], succes: [2] },
                {
                    id: 2,
                    stmts: [
                        'this.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_> = value',
                        'this.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.env_> = null',
                        'this.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.wrapper_> = null',
                        'return this',
                    ],
                    preds: [1, 0],
                    succes: [],
                },
            ],
        },
        {
            methodName: '~GlobalConfig',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        '%0 = this-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.env_>',
                        '%1 = this-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.wrapper_>',
                        'staticinvoke <@%unk/%unk: .napi_delete_reference()>(%0, %1)',
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'New',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: struct napi_env__*',
                        'info = parameter1: struct napi_callback_info__*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'newTarget = undefined',
                        '%0 = &newTarget',
                        'staticinvoke <@%unk/%unk: .napi_get_new_target()>(env, info, %0)',
                        'if newTarget != null',
                    ],
                    preds: [],
                    succes: [1, 6],
                },
                {
                    id: 1,
                    stmts: [
                        'argc = 1',
                        'args = undefined',
                        'jsThis = undefined',
                        '%1 = &argc',
                        '%2 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, %2, null)',
                        'value = 0',
                        'valuetype = undefined',
                        '%3 = args[0]',
                        '%4 = &valuetype',
                        'staticinvoke <@%unk/%unk: .napi_typeof()>(env, %3, %4)',
                        '%5 = @%unk/%unk: napi_valuetype.[static]napi_undefined',
                        'if valuetype != %5',
                    ],
                    preds: [0],
                    succes: [2, 3],
                },
                {
                    id: 2,
                    stmts: [
                        '%6 = args[0]',
                        '%7 = &value',
                        'staticinvoke <@%unk/%unk: .napi_get_value_double()>(env, %6, %7)',
                    ],
                    preds: [1],
                    succes: [3],
                },
                {
                    id: 3,
                    stmts: [
                        '%8 = new @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'instanceinvoke %8.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.constructor(double)>(value)',
                        'obj = %8',
                        'obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.env_> = env',
                        '%9 = <CXXReinterpretCastExpr: void*>obj',
                        '%10 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.wrapper_>',
                        '%11 = &%10',
                        'status = staticinvoke <@%unk/%unk: .napi_wrap()>(env, jsThis, %9, Destructor, null, %11)',
                        '%12 = @%unk/%unk: napi_status.[static]napi_ok',
                        'if status != %12',
                    ],
                    preds: [1, 2],
                    succes: [4, 5],
                },
                {
                    id: 4,
                    stmts: ['%13 = delete obj', 'return jsThis'],
                    preds: [3],
                    succes: [],
                },
                {
                    id: 5,
                    stmts: [
                        'refCount = 0',
                        '%14 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.wrapper_>',
                        '%15 = &refCount',
                        'staticinvoke <@%unk/%unk: .napi_reference_unref()>(env, %14, %15)',
                        'return jsThis',
                    ],
                    preds: [3],
                    succes: [],
                },
                {
                    id: 6,
                    stmts: [
                        'argc = 1',
                        'args = undefined',
                        '%16 = &argc',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %16, args, null, null)',
                        'cons = undefined',
                        '%17 = &cons',
                        'staticinvoke <@%unk/%unk: .napi_get_reference_value()>(env, g_ref, %17)',
                        'instance = undefined',
                        '%18 = &instance',
                        'staticinvoke <@%unk/%unk: .napi_new_instance()>(env, cons, argc, args, %18)',
                        'return instance',
                    ],
                    preds: [0],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetValue',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: struct napi_env__*',
                        'info = parameter1: struct napi_callback_info__*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'jsThis = undefined',
                        '%0 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, null, null, %0, null)',
                        'obj = undefined',
                        '%1 = &obj',
                        '%2 = <CXXReinterpretCastExpr: void**>%1',
                        'staticinvoke <@%unk/%unk: .napi_unwrap()>(env, jsThis, %2)',
                        'num = undefined',
                        '%3 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_>',
                        '%4 = &num',
                        'staticinvoke <@%unk/%unk: .napi_create_double()>(env, %3, %4)',
                        'return num',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'SetValue',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: struct napi_env__*',
                        'info = parameter1: struct napi_callback_info__*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'argc = 1',
                        'value = undefined',
                        'jsThis = undefined',
                        '%0 = &argc',
                        '%1 = &value',
                        '%2 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %0, %1, %2, null)',
                        'obj = undefined',
                        '%3 = &obj',
                        '%4 = <CXXReinterpretCastExpr: void**>%3',
                        'staticinvoke <@%unk/%unk: .napi_unwrap()>(env, jsThis, %4)',
                        '%5 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_>',
                        '%6 = &%5',
                        'staticinvoke <@%unk/%unk: .napi_get_value_double()>(env, value, %6)',
                        'return null',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'PlusOne',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: struct napi_env__*',
                        'info = parameter1: struct napi_callback_info__*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'jsThis = undefined',
                        '%0 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, null, null, %0, null)',
                        'obj = undefined',
                        '%1 = &obj',
                        '%2 = <CXXReinterpretCastExpr: void**>%1',
                        'staticinvoke <@%unk/%unk: .napi_unwrap()>(env, jsThis, %2)',
                        'obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_> = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_> + 1',
                        'num = undefined',
                        '%3 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_>',
                        '%4 = &num',
                        'staticinvoke <@%unk/%unk: .napi_create_double()>(env, %3, %4)',
                        'return num',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};
