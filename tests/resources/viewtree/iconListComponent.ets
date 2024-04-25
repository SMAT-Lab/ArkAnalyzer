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

import Constants, { NotificationLayout as Layout } from '../../common/constants';
import Log from '../../../../../../../../../../common/src/main/ets/default/Log';
import SettingDialog from './settingDialog';
import ConfirmDialog from './confirmDialog'
import NotificationViewModel from '../../viewmodel/NotificationViewModel';
import deviceInfo from '@ohos.deviceInfo';

const deviceTypeInfo = deviceInfo.deviceType;
const TAG = 'NoticeItem-IconListComponent';
let iconSize: number = 0;

type IconData = {
  src?: Resource;
  callback?: () => void
}

export type NotificationUiConfig = {
  iconSize: number;
}

export function getIconListSize(list?: IconData[]) {
  let listSize = list?.length??iconSize;
  return listSize * (Layout.BUTTON_SIZE + 2 * Layout.ICON_MARGIN) + Layout.ICON_MARGIN
}

@Component
export default struct IconListComponent {
  private itemData: any = {}
  private isGroup: boolean= false;
  @Prop iconAlpha: number
  private settingDialogController: CustomDialogController = new CustomDialogController({
    builder: SettingDialog({
      itemData: this.itemData,
      action: () => this.confirmDialogController.open()
    }),
    autoCancel: false,
    alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
    offset: { dx: 0, dy: $r('app.float.setting_dialog_dy') },
    customStyle: true
  });
  private confirmDialogController: CustomDialogController = new CustomDialogController({
    builder: ConfirmDialog({
      title: $r('app.string.closeNovice'),
      bundleName: this.itemData.name,
      action: () => NotificationViewModel.enableNotification(this.itemData, false)
    }),
    autoCancel: false,
    alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
    offset: { dx: 0, dy: $r('app.float.confirm_dialog_dy') },
    customStyle: true
  });
  private iconConfigs: IconData[] = [
    {
      src: $r("app.media.ic_public_settings_filled"),
      callback: () => {
        Log.showInfo(TAG, `click settings hashcode: ${this.itemData?.hashcode}`);
        this.settingDialogController.open()
      }
    }, {
      src: $r("app.media.ic_public_delete_filled"),
      callback: () => {
        if (!this.isGroup) {
          Log.showInfo(TAG, `click delete hashcode: ${this.itemData?.hashcode}`);
          NotificationViewModel.removeNotificationItem(this.itemData, true)
        } else {
          Log.showInfo(TAG, `click delete groupName: ${this.itemData?.groupName}`);
          NotificationViewModel.removeGroupNotification(this.itemData, true)
        }
      }
    }
  ]

  aboutToAppear() {
    Log.showInfo(TAG, `iconConfigs: ${JSON.stringify(this.iconConfigs)}`);
    iconSize = this.iconConfigs.length;
  }

  aboutToDisappear() {
    delete this.settingDialogController
    this.settingDialogController = undefined

    delete this.confirmDialogController
    this.confirmDialogController = undefined

    Log.showInfo(TAG, 'aboutToDisappear')
  }

  build() {
    Flex({ direction: FlexDirection.Row, alignItems: ItemAlign.End, justifyContent: FlexAlign.End }) {
      ForEach(this.iconConfigs, (item) => {
        Button({ type: ButtonType.Circle, stateEffect: true }) {
          if (item.src) {
            Image(item.src)
              .objectFit(ImageFit.Contain)
              .fillColor($r("sys.color.ohos_id_color_primary_contrary"))
              .width(Layout.ICON_SIZE)
              .height(Layout.ICON_SIZE)
          }
        }
        .width(Layout.BUTTON_SIZE)
        .height(Layout.BUTTON_SIZE)
        .opacity(this.iconAlpha)
        .backgroundColor($r("app.color.button_background"))
        .margin({ left: Layout.ICON_MARGIN, right: Layout.ICON_MARGIN })
        .onClick(() => item.callback && item.callback())
      })
    }
    .margin({ left: Layout.ICON_MARGIN })
  }
}

@Component
export struct BottomLeftItem {
  private itemData: any = {};
  private bottomLeftItemHeight: number = 92;

  private settingDialogController: CustomDialogController = new CustomDialogController({
    builder: SettingDialog({
      itemData: this.itemData,
      action: () => this.confirmDialogController.open()
    }),
    autoCancel: false,
    alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
    offset: { dx: 0, dy: $r('app.float.setting_dialog_dy') },
    customStyle: true
  });

  private confirmDialogController: CustomDialogController = new CustomDialogController({
    builder: ConfirmDialog({
      title: $r('app.string.closeNovice'),
      bundleName: this.itemData.name,
      action: () => NotificationViewModel.enableNotification(this.itemData, false)
    }),
    autoCancel: false,
    alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
    offset: { dx: 0, dy: $r('app.float.confirm_dialog_dy') },
    customStyle: true
  });

  aboutToDisappear() {
    delete this.settingDialogController
    this.settingDialogController = undefined

    delete this.confirmDialogController
    this.confirmDialogController = undefined

    Log.showInfo(TAG, 'BottomLeftItem -> aboutToDisappear')
  }

  build(){
    Row() {
      Button({ type: ButtonType.Circle, stateEffect: true }) {
        Image($r("app.media.ic_public_settings_filled"))
          .objectFit(ImageFit.Contain)
          .fillColor($r("sys.color.ohos_id_color_primary_contrary"))
          .width(Layout.ICON_SIZE)
          .height(Layout.ICON_SIZE)
      }
      .backgroundColor($r("app.color.button_background"))
      .onClick(() => this.settingDialogController.open())
      .width(Layout.BUTTON_SIZE)
      .height(Layout.BUTTON_SIZE)
    }
    .height(this.bottomLeftItemHeight)
    .justifyContent(FlexAlign.SpaceEvenly)
    .alignItems(VerticalAlign.Center)
  }
}