/*
 * Copyright (c) 2021-2022 Huawei Device Co., Ltd.
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

import Constants, {NotificationLayout as Layout} from '../../common/constants';
import GeneralItem from './generalItem';
import CustomItem from './customItem';
import Log from '../../../../../../../../../../common/src/main/ets/default/Log';
import NotificationViewModel from '../../viewmodel/NotificationViewModel';
import DevicesDialog from './devicesDialog';
import WantAgent from '@ohos.wantAgent';
import {BottomLeftItem} from './iconListComponent';
import deviceInfo from '@ohos.deviceInfo';
import SwipeLayout from './SwipeLayout';
import {getId} from '../../model/SwipeLayoutUtils';

const TAG = 'NoticeItem-NotificationItem';
const deviceTypeInfo = deviceInfo.deviceType;

@Component
export default struct NotificationItem {
  @State mIconAlpha: number = 0;
  @State itemWidth: string = '100%';
  private itemData: any = {};
  private isSubItem: boolean= false;
  registerEventCapture: (id: string) => boolean = null;

  registerNotificationItemEventCapture(id: string){
    if(this.registerEventCapture != null && this.registerEventCapture(id)){
      return true;
    } else {
      return false;
    }
  }

  deleteButtonCallback(){
    NotificationViewModel.removeNotificationItem(this.itemData, true);
  }

  @Builder SurfaceComponent() {
    Column() {
      FrontItem({ itemData: this.itemData, isSubItem: this.isSubItem })
    }
    .width(this.itemWidth)
    .borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0)
    .clip(!this.isSubItem)
  }

  @Builder BottomLeftComponent() {
    BottomLeftItem({itemData: this.itemData, bottomLeftItemHeight: 92});
  }

  build() {
    Column(){
      SwipeLayout({
        swipeLayoutId: getId(this.itemData, false),
        bottomLeftWidth: 80,
        bottomRightWidth: 60,
        leftThreshold: 100,
        bottomHeight: 92,
        deleteButtonCallback: this.deleteButtonCallback.bind(this),
        SurfaceComponent: this.SurfaceComponent.bind(this),//bug： 此处需绑定this，否则控件无法正常显示
        BottomLeftComponent: this.BottomLeftComponent.bind(this),
        registerEventCapture: this.registerNotificationItemEventCapture.bind(this)
      })
    }
    .width(this.itemWidth)
    .borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0)
    .clip(!this.isSubItem)
  }
}

@Component
struct FrontItem {
  private itemData: any = {}
  private nowWant: any;
  private isSubItem: boolean= false;
  private devicesDialogController: CustomDialogController = new CustomDialogController({
    builder: DevicesDialog({
      action: (deviceID) => this.selectedDevice(deviceID)
    }),
    autoCancel: false,
    offset: { dx: 0, dy: 200 }
  });

  aboutToDisappear() {
    delete this.devicesDialogController
    this.devicesDialogController = undefined
    Log.showInfo(TAG, 'FrontItem -> aboutToDisappear')
  }

  build() {
    Column() {
      if (this.itemData.template?.name) {
        CustomItem({ customItemData: this.itemData, clickAction: () => this.showDevicesDialog(), isSubItem: this.isSubItem })
      } else {
        GeneralItem({ itemData: this.itemData, clickAction: () => this.showDevicesDialog(), isSubItem: this.isSubItem })
      }
    }
    .width('100%')
    .borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0)
    .backgroundColor($r('app.color.notificationitem_background'))
  }

  showDevicesDialog() {
    Log.showInfo(TAG, `showDevicesDialog isDistributed: ${this.itemData?.distributedOption?.isDistributed}`);
    if (!this.itemData?.distributedOption?.isDistributed) {
      NotificationViewModel.clickItem(this.itemData);
      return;
    }
    let wantAgent = this.itemData?.want;
    if (!!wantAgent) {
      WantAgent.getWant(wantAgent).then((want) => {
        this.nowWant = want;
        Log.showInfo(TAG, `showDevicesDialog want: ${JSON.stringify(this.nowWant)}`);
        if (!want?.deviceId) {
          this.devicesDialogController.open();
        } else {
          NotificationViewModel.clickItem(this.itemData);
        }
      })
    } else {
      NotificationViewModel.clickItem(this.itemData);
    }
  }

  selectedDevice(deviceID) {
    Log.showInfo(TAG, `selectedDevice deviceID:${deviceID}`);
    this.nowWant.deviceId = deviceID;
    let triggerInfo = {
      code: 0,
      want: this.nowWant,
      permission: '',
      extraInfo: {}
    };
    NotificationViewModel.clickDistributionItem(this.itemData, triggerInfo);
  }
}