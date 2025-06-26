export const CallFunction_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase6/lazyImportCase6.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (void)[1]',
                '%0[0] = nullptr',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args)',
                'onCall = undefined',
                '%2 = args[0]',
                '%3 = &onCall',
                `staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, %2, 'onCall', %3)`,
                'res = undefined',
                '%4 = args[0]',
                '%5 = &res',
                'staticinvoke <@%unk/%unk: .napi_call_function()>(env, %4, onCall, 0, nullptr, %5)',
                'return onCall'
            ],
            preds: [],
            succes: []
        }
    ]
};