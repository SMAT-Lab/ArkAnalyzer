/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const BASE_CLASS_EXPECT = {
    fields: ['name'],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'pname = parameter0: char&',
                        'this = this: @class/classSample.cpp: Base',
                        'instanceinvoke this.<@class/classSample.cpp: Base.%instInit()>()',
                        'this.<@class/classSample.cpp: Base.name> = pname',
                        '%0 = this.<@class/classSample.cpp: Base.name>',
                        "staticinvoke <@%unk/%unk: .cout()>('Base constructor called with name: ', %0)",
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetName',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Base', '%0 = this.<@class/classSample.cpp: Base.name>', 'return %0'],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const LEFT_CLASS_EXPECT = {
    fields: ['leftPower'],
    heritageClasses: ['Base'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'name = parameter0: char&',
                        'power = parameter1: int',
                        'this = this: @class/classSample.cpp: Left',
                        'instanceinvoke this.<@class/classSample.cpp: Base.constructor(char&)>(name)',
                        'instanceinvoke this.<@class/classSample.cpp: Left.%instInit()>()',
                        'this.<@class/classSample.cpp: Left.leftPower> = power',
                        '%0 = this.<@class/classSample.cpp: Left.leftPower>',
                        "staticinvoke <@%unk/%unk: .cout()>('Left constructor called with power: ', %0)",
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetLeftPower',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Left', '%0 = this.<@class/classSample.cpp: Left.leftPower>', 'return %0'],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const RIGHT_CLASS_EXPECT = {
    fields: ['rightSpeed'],
    heritageClasses: ['Base'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'name = parameter0: char&',
                        'speed = parameter1: double',
                        'this = this: @class/classSample.cpp: Right',
                        'instanceinvoke this.<@class/classSample.cpp: Base.constructor(char&)>(name)',
                        'instanceinvoke this.<@class/classSample.cpp: Right.%instInit()>()',
                        'this.<@class/classSample.cpp: Right.rightSpeed> = speed',
                        '%0 = this.<@class/classSample.cpp: Right.rightSpeed>',
                        "staticinvoke <@%unk/%unk: .cout()>('Right constructor called with speed: ', %0)",
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetRightSpeed',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Right', '%0 = this.<@class/classSample.cpp: Right.rightSpeed>', 'return %0'],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const DERIVED_CLASS_EXPECT = {
    fields: ['robotId'],
    heritageClasses: ['Left', 'Right', 'Base'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'name = parameter0: char&',
                        'id = parameter1: int',
                        'power = parameter2: int',
                        'speed = parameter3: double',
                        'this = this: @class/classSample.cpp: Derived',
                        'instanceinvoke this.<@class/classSample.cpp: Base.constructor(char&)>(name)',
                        'instanceinvoke this.<@class/classSample.cpp: Left.constructor(char&, int)>(name, power)',
                        'instanceinvoke this.<@class/classSample.cpp: Right.constructor(char&, double)>(name, speed)',
                        'instanceinvoke this.<@class/classSample.cpp: Derived.%instInit()>()',
                        'this.<@class/classSample.cpp: Derived.robotId> = id',
                        '%0 = this.<@class/classSample.cpp: Derived.robotId>',
                        "staticinvoke <@%unk/%unk: .cout()>('Derived constructor called with id: ', %0)",
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'GetRobotId',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Derived', '%0 = this.<@class/classSample.cpp: Derived.robotId>', 'return %0'],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'Introduce',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Derived',
                        "staticinvoke <@%unk/%unk: .cout()>('=== Robot Info ===')",
                        '%0 = this.<@class/classSample.cpp: Derived.GetName>',
                        '%1 = instanceinvoke this.<@class/classSample.cpp: Derived.GetName()>(%0)',
                        "staticinvoke <@%unk/%unk: .cout()>('Name: ', %1)",
                        '%2 = this.<@class/classSample.cpp: Derived.robotId>',
                        "staticinvoke <@%unk/%unk: .cout()>('ID: ', %2)",
                        '%3 = this.<@class/classSample.cpp: Derived.GetLeftPower>',
                        '%4 = instanceinvoke this.<@class/classSample.cpp: Derived.GetLeftPower()>(%3)',
                        "staticinvoke <@%unk/%unk: .cout()>('Left Power: ', %4)",
                        '%5 = this.<@class/classSample.cpp: Derived.GetRightSpeed>',
                        '%6 = instanceinvoke this.<@class/classSample.cpp: Derived.GetRightSpeed()>(%5)',
                        "staticinvoke <@%unk/%unk: .cout()>('Right Speed: ', %6)",
                        'return',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const ANIMAL_CLASS_EXPECT = {
    fields: [],
    heritageClasses: [],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Animal', 'instanceinvoke this.<@class/classSample.cpp: Animal.%instInit()>()', 'return this'],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'Sound',
            blocks: undefined,
        },
    ],
};

export const CAT_CLASS_EXPECT = {
    fields: [],
    heritageClasses: ['Animal'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Cat',
                        'instanceinvoke this.<@class/classSample.cpp: Animal.constructor()>()',
                        'instanceinvoke this.<@class/classSample.cpp: Cat.%instInit()>()',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'Sound',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Cat', "staticinvoke <@%unk/%unk: .cout()>('meow meow mewo!')", 'return'],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const DOG_CLASS_EXPECT = {
    fields: [],
    heritageClasses: ['Animal'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Dog',
                        'instanceinvoke this.<@class/classSample.cpp: Animal.constructor()>()',
                        'instanceinvoke this.<@class/classSample.cpp: Dog.%instInit()>()',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'Sound',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Dog', "staticinvoke <@%unk/%unk: .cout()>('wo wo wo!')", 'return'],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const PIG_CLASS_EXPECT = {
    fields: [],
    heritageClasses: ['Animal'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'this = this: @class/classSample.cpp: Pig',
                        'instanceinvoke this.<@class/classSample.cpp: Animal.constructor()>()',
                        'instanceinvoke this.<@class/classSample.cpp: Pig.%instInit()>()',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
        {
            methodName: 'Sound',
            blocks: [
                {
                    id: 0,
                    stmts: ['this = this: @class/classSample.cpp: Pig', "staticinvoke <@%unk/%unk: .cout()>('Aooooooowooooo!')", 'return'],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const D_CLASS_EXPECT = {
    fields: [],
    heritageClasses: ['Base'],
    blocks: [
        {
            methodName: 'constructor',
            blocks: [
                {
                    id: 0,
                    stmts: [
                        'pname = parameter0: char&',
                        'this = this: @class/classSample.cpp: D',
                        'instanceinvoke this.<@class/classSample.cpp: Base.constructor(char&)>(pname)',
                        'instanceinvoke this.<@class/classSample.cpp: D.%instInit()>()',
                        'return this',
                    ],
                    preds: [],
                    succes: [],
                },
            ],
        },
    ],
};

export const MAIN_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @class/classSample.cpp: %dflt',
                '%0 = new @class/classSample.cpp: Derived',
                "instanceinvoke %0.<@class/classSample.cpp: Derived.constructor(char&, int, int, double)>('X', 101, 75, 3.6)",
                'd = %0',
                'instanceinvoke d.<@class/classSample.cpp: Derived.Introduce()>()',
                '%1 = new @class/classSample.cpp: Dog',
                'instanceinvoke %1.<@class/classSample.cpp: Dog.constructor()>()',
                'staticinvoke <@%unk/%unk: .MakeSound()>(%1)',
                'd1 = staticinvoke <@%unk/%unk: .undefined()>(100)',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};
