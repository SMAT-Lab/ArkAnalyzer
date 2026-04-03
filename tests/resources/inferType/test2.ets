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
import type { SCBUnlockTransitionController } from './test1';
import { SCBTransitionManager } from './test1';
import { Events } from './test1';
import { media } from '@kit.MediaKit';
import { collections } from '@kit.ArkTS';
import { Callback } from '@ohos.base';

export class SCBSceneSessionManager {
  private property1:collections.Array<number> = new collections.Array();

  private unLockTransitionController: SCBUnlockTransitionController = {
    name: '123',
    onLock: this.onLockReceived.bind(this),
    onUnlock: this.onUnLockReceived.bind(this),
  };

  private registerUnlockTransitionController(): void {
    this.unLockTransitionController = {
      name: 'SCBSceneSessionManager',
      onLock: this.onLockReceived.bind(this),
      onUnlock: this.onUnLockReceived.bind(this),
    };
    SCBTransitionManager.getInstance().registerUnlockTransitionController(
      this.unLockTransitionController,
      false
    );
  }

  private onLockReceived(): void {
    return;
  }

  private onUnLockReceived(): void {
    return;
  }
}

function demoCallBack(){
    media.createAVPlayer((error:BusinessError, player) =>{
        player.on('audioInterrupt',() => console.error('createAVPlayer audioInterrupt'));
    })

    media.createAVPlayer().then((player) =>{
        let mode = 'audioInterrupt';
        player.on(mode,() => console.error('createAVPlayer audioInterrupt2'));
    }).catch((error:BusinessError)=>{console.error('createAVPlayer error')})
}


function matchOverride(){
    media.createAVPlayer((error:BusinessError, player) =>{
        player.on(Events.STATE_CHANGE,(state: media.AVPlayerState) => console.error('AVPlayer STATE_CHANGE' + state));
    })
}


class TestCallback {
    private myCallback: Callback<string> | undefined = undefined;

    constructor(callback: Callback<string>) {
        this.myCallback = callback;
    }

    foo(): void {
        this.myCallback('abc');  // ArkInstanceInvokeExpr, method 为Test.myCallback, 无param，但是arg为'abc'，导致数据流构建失败
    }
}