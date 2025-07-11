export const MapDemo_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                "env = parameter0: int",
                "info = parameter1: int",
                "this = this: @lazyImportCase3/lazyImportCase3.cpp: %dflt",
                "requireArgc = 2",
                "argc = 2",
                "%0 = newarray (void)[1]",
                "%0[0] = nullptr",
                "args = %0",
                "%1 = &argc",
                "staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, nullptr, nullptr)",
                "str1 = undefined",
                "str1_len = undefined",
                "%2 = args[0]",
                "%3 = &str1_len",
                "staticinvoke <@%unk/%unk: .napi_get_value_string_utf8()>(env, %2, str1, 100, %3)",
                "num = undefined",
                "%4 = args[1]",
                "%5 = &num",
                "staticinvoke <@%unk/%unk: .napi_get_value_int32()>(env, %4, %5)",
                "return nullptr",
            ],
            preds: [],
            succes: []
        }
    ]
};