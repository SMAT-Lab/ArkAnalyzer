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

export const IfElseTest1_Expect_ViewTree =
{
    name: 'Column',
    children: [
        { name: 'Text', children: [] },
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'Text',
                            children: []
                        },
                        {
                            name: 'If',
                            children: [
                                {
                                    name: 'IfBranch',
                                    children: [{
                                        name: 'Text',
                                        children: []
                                    }]
                                },
                                {
                                    name: 'IfBranch',
                                    children: [{
                                        name: 'Text',
                                        children: []
                                    }]
                                }
                            ],
                            stateValues: ['toggleColor']
                        }
                    ]
                },
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'Text',
                            children: []
                        },
                        {
                            name: 'If',
                            children: [
                                {
                                    name: 'IfBranch',
                                    children: [{
                                        name: 'Text',
                                        children: []
                                    }]
                                },
                                {
                                    name: 'IfBranch',
                                    children: [{
                                        name: 'Text',
                                        children: []
                                    }]
                                }
                            ],
                            stateValues: ['toggleColor']
                        }
                    ]
                }
            ],
            stateValues: ['toggle']
        },
        { name: 'Text', children: [] },
        { name: 'Button', children: [], stateValues: ['toggle'] },
        { name: 'Button', children: [], stateValues: ['toggleColor'] }
    ]
};

export const CounterView_Expect_ViewTree = {
    name: 'Row',
    children: [
        { name: 'Text', children: [] },
        { name: 'Button', children: [], stateValues: ['counter'] }
    ]
}

export const IfElseTest2_Expect_ViewTree = {
    name: 'Column',
    children: [
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'View',
                            children: [
                                CounterView_Expect_ViewTree
                            ]
                        }
                    ]
                },
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'View',
                            children: [
                                CounterView_Expect_ViewTree
                            ]
                        }
                    ]
                }
            ],
            stateValues: ['toggle']
        },
        {
            name: 'Button',
            children: [],
            stateValues: ['toggle']
        }
    ]
}

export const IfElseTest3_Expect_ViewTree =
{
    name: 'Column',
    children: [
        { name: 'Text', children: [], stateValues: ['count'] },
        { name: 'Builder', children:[
            {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'Text',
                            children: []
                        }
                    ]
                },
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'Text',
                            children: []
                        }
                    ]
                }
            ],
            stateValues: ['count']
        }
    ]},
        
        { name: 'Button', children: [], stateValues: ['count'] },
        { name: 'Button', children: [], stateValues: ['count'] }
    ]
};

export const TernaryIfElseTest_Expect_ViewTree = {
    name: 'Column',
    children: [
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [{ name: 'Text', children: [] }],
                },
                {
                    name: 'IfBranch',
                    children: [{ name: 'Text', children: [] }],
                },
            ],
            stateValues: ['flag'],
        },
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [],
                },
                {
                    name: 'IfBranch',
                    children: [{ name: 'Text', children: [] }],
                },
            ],
            stateValues: ['flag'],
        },
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'If',
                            children: [
                                {
                                    name: 'IfBranch',
                                    children: [{ name: 'Text', children: [] }],
                                },
                                {
                                    name: 'IfBranch',
                                    children: [{ name: 'Text', children: [] }],
                                },
                            ],
                            stateValues: ['nested'],
                        },
                    ],
                },
                {
                    name: 'IfBranch',
                    children: [{ name: 'Text', children: [] }],
                },
            ],
            stateValues: ['flag'],
        },
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [],
                },
                {
                    name: 'IfBranch',
                    children: [],
                },
            ],
            stateValues: ['flag'],
        },
        {
            name: 'Text',
            children: [],
        },
        {
            name: 'Builder',
            children: [
                {
                    name: 'If',
                    children: [
                        {
                            name: 'IfBranch',
                            children: [],
                        },
                        {
                            name: 'IfBranch',
                            children: [],
                        },
                    ],
                },
                {
                    name: 'Text',
                    children: [],
                },
            ],
            stateValues: ['flag'],
        },
    ],
};