export const TYPEDEF_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @typedef/typedef.cpp: %dflt',
                'type @typedef/typedef.cpp: %dflt.main()#StrToVecMap = @std/map.h: map',
                "%0 = new @%unk/%unk: StrToVecMap",
                "instanceinvoke %0.<@%unk/%unk: StrToVecMap.constructor()>()",
                "myMap = %0",
                "%1 = myMap['key']",
                "instanceinvoke myMap['key'].<@%unk/%unk: .push_back()>(%1, 1)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ]
};
