export const TYPEDEF_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @typedef/typedef.cpp: %dflt',
                'type @typedef/typedef.cpp: %dflt.main()#StrToVecMap = @std/map.h: map',
                'myMap = staticinvoke <@%unk/%unk: .undefined()>()',
                "%0 = myMap['key']",
                "instanceinvoke myMap['key'].<@%unk/%unk: .push_back()>(%0, 1)",
                'return'
            ],
            preds: [],
            succes: []
        },
    ]
};
