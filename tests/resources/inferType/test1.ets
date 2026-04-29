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
export interface SCBUnlockTransitionController {
  name: string;
  onLock: () => void;
  onUnlock: () => void;
}

export class SCBTransitionManager {
  static getInstance(): SCBTransitionManager {
    if (globalThis.SCBTransitionManagerInstance == null) {
      globalThis.SCBTransitionManagerInstance = new SCBTransitionManager();
    }
    return globalThis.SCBTransitionManagerInstance;
  }

  registerUnlockTransitionController(
    controller: SCBUnlockTransitionController | undefined,
    isHomeState: boolean
  ): boolean {
    return isHomeState;
  }
}

export enum Events {
    STATE_CHANGE = 'stateChange'
}

namespace MethodReturnType {
    async function foo() {
        console.log('this is async method');
    }

    async function goo() {
        await foo();
    }

    async function zoo() {
        return foo();
    }
}