export const BASE_CLASS_EXPECT = {
    fields: [
        'name',
    ],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@class/classSample.cpp: Base.%instInit()>()',
                        'name = parameter0: char&',
                        'this = this: @class/classSample.cpp: Base',
                        `staticinvoke <@%unk/%unk: .cout()>('"Base constructor called with name: "', name)`,
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'getName',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Base',
                        '%0 = this.<@class/classSample.cpp: Base.name>',
                        'return %0'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};

export const LEFT_CLASS_EXPECT = {
    fields: [
        'leftPower',
    ],
    heritageClasses: [
        'Base'
    ],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@class/classSample.cpp: Left.%instInit()>()',
                        'name = parameter0: char&',
                        'power = parameter1: int',
                        'this = this: @class/classSample.cpp: Left',
                        '%0 = new @class/classSample.cpp: Base',
                        'instanceinvoke %0.<@class/classSample.cpp: Base.constructor()>(name)',
                        '%1 = this.<@class/classSample.cpp: Left.leftPower>',
                        `staticinvoke <@%unk/%unk: .cout()>('"Left constructor called with power: "', %1)`,
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'getLeftPower',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Left',
                        '%0 = this.<@class/classSample.cpp: Left.leftPower>',
                        'return %0'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};

export const RIGHT_CLASS_EXPECT = {
    fields: [
        'rightSpeed',
    ],
    heritageClasses: [
        'Base'
    ],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@class/classSample.cpp: Right.%instInit()>()',
                        'name = parameter0: char&',
                        'speed = parameter1: double',
                        'this = this: @class/classSample.cpp: Right',
                        '%0 = new @class/classSample.cpp: Base',
                        'instanceinvoke %0.<@class/classSample.cpp: Base.constructor()>(name)',
                        '%1 = this.<@class/classSample.cpp: Right.rightSpeed>',
                        `staticinvoke <@%unk/%unk: .cout()>('"Right constructor called with speed: "', %1)`,
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'getRightSpeed',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Right',
                        '%0 = this.<@class/classSample.cpp: Right.rightSpeed>',
                        'return %0'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        }
    ]
};

export const DERIVED_CLASS_EXPECT = {
    fields: [
        'robotId',
    ],
    heritageClasses: [
        'Left',
        'Right'
    ],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'instanceinvoke this.<@class/classSample.cpp: Derived.%instInit()>()',
                        'name = parameter0: char&',
                        'id = parameter1: int',
                        'power = parameter2: int',
                        'speed = parameter3: double',
                        'this = this: @class/classSample.cpp: Derived',
                        '%0 = new @class/classSample.cpp: Base',
                        'instanceinvoke %0.<@class/classSample.cpp: Base.constructor()>(name)',
                        '%1 = new @class/classSample.cpp: Left',
                        'instanceinvoke %1.<@class/classSample.cpp: Left.constructor()>(name, power)',
                        '%2 = new @class/classSample.cpp: Right',
                        'instanceinvoke %2.<@class/classSample.cpp: Right.constructor()>(name, speed)',
                        '%3 = this.<@class/classSample.cpp: Derived.robotId>',
                        `staticinvoke <@%unk/%unk: .cout()>('"Derived constructor called with id: "', %3)`,
                        'return this'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'getRobotId',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Derived',
                        '%0 = this.<@class/classSample.cpp: Derived.robotId>',
                        'return %0'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
        {
            methodName: 'introduce',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Derived',
                        `staticinvoke <@%unk/%unk: .cout()>('"=== Robot Info ==="')`,
                        '%0 = this.<@class/classSample.cpp: Derived.getName>',
                        '%1 = staticinvoke <@%unk/%unk: .undefined()>(%0)',
                        `staticinvoke <@%unk/%unk: .cout()>('"Name: "', %1)`,
                        '%2 = this.<@class/classSample.cpp: Derived.robotId>',
                        `staticinvoke <@%unk/%unk: .cout()>('"ID: "', %2)`,
                        '%3 = this.<@class/classSample.cpp: Derived.getLeftPower>',
                        '%4 = staticinvoke <@%unk/%unk: .undefined()>(%3)',
                        `staticinvoke <@%unk/%unk: .cout()>('"Left Power: "', %4)`,
                        '%5 = this.<@class/classSample.cpp: Derived.getRightSpeed>',
                        '%6 = staticinvoke <@%unk/%unk: .undefined()>(%5)',
                        `staticinvoke <@%unk/%unk: .cout()>('"Right Speed: "', %6)`,
                        'return'
                    ],
                    preds: [],
                    succes: []
                }
            ]
        },
    ]
};

export const MAIN_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @class/classSample.cpp: %dflt',
                '%0 = new @class/classSample.cpp: Derived',
                "instanceinvoke %0.<@class/classSample.cpp: Derived.constructor()>('X', 101, 75, 3.6)",
                'd = %0',
                'instanceinvoke d.<@class/classSample.cpp: Derived.introduce()>()',
                'return 0'
            ],
            preds: [],
            succes: []
        }
    ]
};