/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
type Cat = {
    name: string;
};

class Dog {
    name: string | undefined;
}

export type { Cat, Dog };

export { type Cat as Cat1, Dog as Dog1 };

export type A = '1';

export default A;

export { type Cat as Cat2, Dog as Dog2 } from './exportType';