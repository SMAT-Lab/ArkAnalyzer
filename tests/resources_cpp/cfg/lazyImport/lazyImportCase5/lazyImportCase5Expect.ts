export const Napi_AddPropertyInt32_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'obj = parameter1: int',
                'key = parameter2: char*',
                'value = parameter3: int',
                'this = this: @lazyImportCase5/lazyImportCase5.cpp: %dflt',
                'key_napi = nullptr',
                'status = undefined',
                'value_napi = nullptr',
                '%0 = &value_napi',
                'status = staticinvoke <@%unk/%unk: .napi_create_int32()>(env, value, %0)',
                'status = staticinvoke <@%unk/%unk: .napi_set_property()>(env, obj, key_napi, value_napi)',
                'return true'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const CallbackToArkTS_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase5/lazyImportCase5.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (void)[1]',
                '%0[0] = nullptr',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, nullptr, nullptr)',
                'argv = nullptr',
                '%2 = &argv',
                'staticinvoke <@%unk/%unk: .napi_create_object()>(env, %2)',
                `staticinvoke <@%unk/%unk: .Napi_AddPropertyInt32()>(env, argv, '"type"', 1)`,
                `staticinvoke <@%unk/%unk: .Napi_AddPropertyInt32()>(env, argv, '"index"', 2)`,
                'result = nullptr',
                '%3 = args[0]',
                '%4 = &argv',
                '%5 = &result',
                'staticinvoke <@%unk/%unk: .napi_call_function()>(env, %3, 1, %4, %5)',
                'typeNumber = nullptr',
                '%6 = &typeNumber',
                `staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, result, '"type"', %6)`,
                'number = undefined',
                '%7 = &number',
                'staticinvoke <@%unk/%unk: .napi_get_value_int32()>(env, typeNumber, %7)',
                'return result'
            ],
            preds: [],
            succes: []
        }
    ]
};