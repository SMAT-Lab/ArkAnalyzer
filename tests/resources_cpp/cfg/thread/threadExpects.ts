export const THREAD_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @thread/thread.cpp: %dflt",
                "%0 = new @%unk/%unk: thread",
                "instanceinvoke %0.<@%unk/%unk: thread.constructor()>(hello)",
                "t = %0",
                "instanceinvoke t.<@%unk/%unk: .join()>()",
                "staticinvoke <@%unk/%unk: .cout()>('Hello from main!\\n')",
                "return 0",
            ],
            preds: [],
            succes: []
        },
    ]
};

export const THREAD_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @thread/thread.cpp: %dflt",
                "a = 5",
                "%0 = new @%unk/%unk: thread",
                "instanceinvoke %0.<@%unk/%unk: thread.constructor()>(print_sum, a, 7)",
                "t = %0",
                "instanceinvoke t.<@%unk/%unk: .join()>()",
                "return 0",
            ],
            preds: [],
            succes: []
        },
    ]
};

export const THREAD_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @thread/thread.cpp: %dflt",
                "%0 = new @%unk/%unk: std::thread",
                "instanceinvoke %0.<@%unk/%unk: std::thread.constructor()>(hello)",
                "t = %0",
                "instanceinvoke t.<@%unk/%unk: .join()>()",
                "staticinvoke <@%unk/%unk: .cout()>('Hello from main!\\n')",
                "return 0",
            ],
            preds: [],
            succes: []
        },
    ]
};

export const THREAD_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                "this = this: @thread/thread.cpp: %dflt",
                "a = 5",
                "%0 = new @%unk/%unk: std::thread",
                "instanceinvoke %0.<@%unk/%unk: std::thread.constructor()>(print_sum, a, 7)",
                "t = %0",
                "instanceinvoke t.<@%unk/%unk: .join()>()",
                "return 0",
            ],
            preds: [],
            succes: []
        },
    ]
};