export const AUTO_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @decltype/decltype.cpp: %dflt',
                'a = 5',
                '%0 = new @%unk/%unk: std::vector<int>',
                '%1 = newarray (int[])[3]',
                '%1[0] = 1',
                '%1[1] = 2',
                '%1[2] = 3',
                'instanceinvoke %0.<@%unk/%unk: std::vector<int>.constructor()>(%1)',
                'vec = %0',
                'it = instanceinvoke vec.<@std/vector.h: vector.begin()>()',
                'it2 = vec[0]',
                'lambda = %AM0$autoTest',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const DECLTYPE_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @decltype/decltype.cpp: %dflt',
                'a = 10',
                'w = 10',
                'b = 5',
                'y = b',
                'c = 10',
                'y = c',
                'z = 42',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};