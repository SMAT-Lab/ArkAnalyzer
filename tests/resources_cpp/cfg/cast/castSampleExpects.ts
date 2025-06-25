export const CAST_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'd = 3',
                'i = <double>d',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const CAST_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'i = 2',
                'i_float = <float>i',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const CAST_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'ci = 2',
                '%0 = &ci',
                'pi = <int*>%0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const CAST_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                '%0 = new @cast/castSample.cpp: Circle',
                'instanceinvoke %0.<@cast/castSample.cpp: Circle.constructor()>()',
                's = %0',
                'c = <@cast/castSample.cpp: Circle*>s',
                'if c != 0'
            ],
            preds: [],
            succes: [ 1, 2 ]
        },
        {
            id: 1,
            stmts: [ 'instanceinvoke c.<@cast/castSample.cpp: Circle.draw()>()' ],
            preds: [ 0 ],
            succes: [ 2 ]
        },
        { id: 2, stmts: [ 'return' ], preds: [ 1, 0 ], succes: [] }
    ]
};

export const CAST_EXPECT_CASE5 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                '%0 = newarray (int)[42]',
                'pi = %0',
                'pd = <double*>pi',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};

export const CAST_EXPECT_CASE6 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @cast/castSample.cpp: %dflt',
                'x = <int>3.14',
                `y = <std::basic_string<char>>'hello'`,
                '%0 = new @cast/castSample.cpp: Widget',
                'instanceinvoke %0.<@cast/castSample.cpp: Widget.constructor()>(42)',
                'w = <@cast/castSample.cpp: Widget>%0',
                'return'
            ],
            preds: [],
            succes: []
        }
    ]
};