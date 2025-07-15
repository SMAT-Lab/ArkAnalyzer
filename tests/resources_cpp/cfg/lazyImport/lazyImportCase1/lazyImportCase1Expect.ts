export const LAZY_IMPORT_CASE1_CLASS = {
    fields: [
        'value_',
        'env_',
        'wrapper_',
        'instance_'
    ],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'Init',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: int',
                        'exports = parameter1: int',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'properties = undefined',
                        'cons = undefined',
                        '%0 = &g_ref',
                        'staticinvoke <@%unk/%unk: .napi_create_reference()>(env, cons, 1, %0)',
                        "staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, exports, 'GlobalConfig', cons)",
                        'return exports'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'Destructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: int',
                        'nativeObject = parameter1: void*',
                        'finalize_hint = parameter2: void*',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        '%0 = delete <@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig*>nativeObject',
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
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
                        "this.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_> = value",
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: '~GlobalConfig',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'New',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: int',
                        'info = parameter1: int',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'newTarget = undefined',
                        '%0 = &newTarget',
                        'staticinvoke <@%unk/%unk: .napi_get_new_target()>(env, info, %0)',
                        'if newTarget != nullptr'
                    ],
                    preds: [],
                    succes: [1, 6]
                },
                {
                    id: 1,
                    stmts: [
                        'argc = 1',
                        'args = undefined',
                        'jsThis = undefined',
                        '%1 = &argc',
                        '%2 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, %2, nullptr)',
                        'value = 0',
                        'valuetype = undefined',
                        '%3 = args[0]',
                        '%4 = &valuetype',
                        'staticinvoke <@%unk/%unk: .napi_typeof()>(env, %3, %4)',
                        'if valuetype != napi_undefined != 0'
                    ],
                    preds: [0],
                    succes: [2, 3]
                },
                {
                    id: 2,
                    stmts: [
                        '%5 = args[0]',
                        '%6 = &value',
                        'staticinvoke <@%unk/%unk: .napi_get_value_double()>(env, %5, %6)'
                    ],
                    preds: [1],
                    succes: [3]
                },
                {
                    id: 3,
                    stmts: [
                        '%7 = new @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'instanceinvoke %7.<@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.constructor()>(value)',
                        'obj = %7',
                        'obj = env',
                        'status = undefined',
                        'if status != napi_ok != 0'
                    ],
                    preds: [1, 2],
                    succes: [4, 5]
                },
                {
                    id: 4,
                    stmts: [
                        '%8 = delete obj',
                        'return jsThis'
                    ],
                    preds: [3],
                    succes: []
                },
                {
                    id: 5,
                    stmts: [
                        'refCount = 0',
                        '%9 = &refCount',
                        'staticinvoke <@%unk/%unk: .napi_reference_unref()>(env, obj, %9)',
                        'return jsThis'
                    ],
                    preds: [3],
                    succes: []
                },
                {
                    id: 6,
                    stmts: [
                        'argc = 1',
                        'args = undefined',
                        '%10 = &argc',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %10, args, nullptr, nullptr)',
                        'cons = undefined',
                        '%11 = &cons',
                        'staticinvoke <@%unk/%unk: .napi_get_reference_value()>(env, g_ref, %11)',
                        'instance = undefined',
                        '%12 = &instance',
                        'staticinvoke <@%unk/%unk: .napi_new_instance()>(env, cons, argc, args, %12)',
                        'return instance'
                    ],
                    preds: [0],
                    succes: []
                },
            ]
        },
        {
            methodName: 'GetValue',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: int',
                        'info = parameter1: int',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'jsThis = undefined',
                        '%0 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, nullptr, nullptr, %0, nullptr)',
                        'obj = undefined',
                        '%1 = &obj',
                        '%2 = <void**>%1',
                        'staticinvoke <@%unk/%unk: .napi_unwrap()>(env, jsThis, %2)',
                        'num = undefined',
                        '%3 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_>',
                        '%4 = &num',
                        'staticinvoke <@%unk/%unk: .napi_create_double()>(env, %3, %4)',
                        'return num'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'SetValue',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: int',
                        'info = parameter1: int',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'argc = 1',
                        'value = undefined',
                        'jsThis = undefined',
                        '%0 = &argc',
                        '%1 = &value',
                        '%2 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %0, %1, %2, nullptr)',
                        'obj = undefined',
                        '%3 = &obj',
                        '%4 = <void**>%3',
                        'staticinvoke <@%unk/%unk: .napi_unwrap()>(env, jsThis, %4)',
                        '%5 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_>',
                        '%6 = &%5',
                        'staticinvoke <@%unk/%unk: .napi_get_value_double()>(env, value, %6)',
                        'return nullptr'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'PlusOne',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'env = parameter0: int',
                        'info = parameter1: int',
                        'this = this: @lazyImportCase1/lazyImportCase1.cpp: GlobalConfig',
                        'jsThis = undefined',
                        '%0 = &jsThis',
                        'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, nullptr, nullptr, %0, nullptr)',
                        'obj = undefined',
                        '%1 = &obj',
                        '%2 = <void**>%1',
                        'staticinvoke <@%unk/%unk: .napi_unwrap()>(env, jsThis, %2)',
                        'obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_> = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_> + 1',
                        'num = undefined',
                        '%3 = obj-><@lazyImportCase1/lazyImportCase1.cpp: GlobalConfig.value_>',
                        '%4 = &num',
                        'staticinvoke <@%unk/%unk: .napi_create_double()>(env, %3, %4)',
                        'return num'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
    ]
};