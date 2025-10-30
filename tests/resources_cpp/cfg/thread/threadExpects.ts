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

export const THREAD_EXPECT_CASE1 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @thread/thread.cpp: %dflt',
                '%0 = new @%unk/%unk: thread',
                'instanceinvoke %0.<@%unk/%unk: thread.constructor()>(Hello)',
                't = %0',
                'instanceinvoke t.<@%unk/%unk: .join()>()',
                'staticinvoke <@%unk/%unk: .cout()>(\'Hello from main!\\n\')',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const THREAD_EXPECT_CASE2 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @thread/thread.cpp: %dflt',
                'a = 5',
                '%0 = new @%unk/%unk: thread',
                'instanceinvoke %0.<@%unk/%unk: thread.constructor()>(PrintSum, a, 7)',
                't = %0',
                'instanceinvoke t.<@%unk/%unk: .join()>()',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const THREAD_EXPECT_CASE3 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @thread/thread.cpp: %dflt',
                '%0 = new @%unk/%unk: std::thread',
                'instanceinvoke %0.<@%unk/%unk: std::thread.constructor()>(Hello)',
                't = %0',
                'instanceinvoke t.<@%unk/%unk: .join()>()',
                "staticinvoke <@%unk/%unk: .cout()>('Hello from main!\\n')",
                'return 0'
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const THREAD_EXPECT_CASE4 = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @thread/thread.cpp: %dflt',
                'a = 5',
                '%0 = new @%unk/%unk: std::thread',
                'instanceinvoke %0.<@%unk/%unk: std::thread.constructor()>(PrintSum, a, 7)',
                't = %0',
                'instanceinvoke t.<@%unk/%unk: .join()>()',
                'return 0',
            ],
            preds: [],
            succes: [],
        },
    ],
};
