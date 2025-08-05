export const NativeCallArkTS8_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                "env = parameter0: int",
                "info = parameter1: int",
                "this = this: @lazyImportCase8/lazyImportCase8.cpp: %dflt",
                "argc = 1",
                "%0 = newarray (void[])[1]",
                "%0[0] = nullptr",
                "args = %0",
                "%1 = &argc",
                "staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, nullptr, nullptr)",
                "argv = nullptr",
                "%2 = &argv",
                "staticinvoke <@%unk/%unk: .napi_create_int32()>(env, 2, %2)",
                "result = nullptr",
                "%3 = args[0]",
                "%4 = &argv",
                "%5 = &result",
                "staticinvoke <@%unk/%unk: .napi_call_function()>(env, nullptr, %3, 1, %4, %5)",
                "return result",
            ],
            preds: [],
            succes: []
        }
    ]
};