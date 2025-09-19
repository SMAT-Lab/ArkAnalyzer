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
export const DestBody_Expect_ViewTree = {
    name: 'Column',
    children: []
};

export const Fade_Expect_ViewTree = {
    name: 'View',
    children: [
        DestBody_Expect_ViewTree
    ]
};

export const Explode_Expect_ViewTree = {
    name: 'View',
    children: [
        {
            name: 'Row',
            children: []
        }
    ]
};

export const PageMap_Expect_ViewTree = {
    name: 'Builder',
    children: [
        {
            name: 'If',
            children: [
                {
                    name: 'IfBranch',
                    children: [
                        Fade_Expect_ViewTree
                    ]
                },
                {
                    name: 'IfBranch',
                    children: [
                        {
                            name: 'If',
                            children: [
                                {
                                    name: 'IfBranch',
                                    children: [
                                        Explode_Expect_ViewTree
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

export const navDestinationTest_Expect_ViewTree = {
    name: 'Navigation',
    stateValues: ['stack'],
    children: [{
        name: 'Behavior',
        stateValues: ['stack'],
        children: [
            PageMap_Expect_ViewTree
        ]
    }
    ]
};