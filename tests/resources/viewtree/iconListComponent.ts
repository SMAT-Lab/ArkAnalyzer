interface BottomLeftItem_Params {
    itemData?: any;
    bottomLeftItemHeight?: number;
    settingDialogController?: CustomDialogController;
    confirmDialogController?: CustomDialogController;
}
interface IconListComponent_Params {
    itemData?: any;
    isGroup?: boolean;
    iconAlpha?: number;
    settingDialogController?: CustomDialogController;
    confirmDialogController?: CustomDialogController;
    iconConfigs?: IconData[];
}
let __generate__Id: number = 0;
function generateId(): string {
    return "iconListComponent_" + ++__generate__Id;
}
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
import ConfirmDialog from './confirmDialog';
import NotificationViewModel from '../../viewmodel/NotificationViewModel';
import deviceInfo from '@ohos.deviceInfo';
const deviceTypeInfo = deviceInfo.deviceType;
const TAG = 'NoticeItem-IconListComponent';
let iconSize: number = 0;
type IconData = {
    src?: Resource;
    callback?: () => void;
};
export type NotificationUiConfig = {
    iconSize: number;
};
export function getIconListSize(list?: IconData[]) {
    let listSize = list?.length ?? iconSize;
    return listSize * (Layout.BUTTON_SIZE + 2 * Layout.ICON_MARGIN) + Layout.ICON_MARGIN;
}
export default class IconListComponent extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.itemData = {};
        this.isGroup = false;
        this.__iconAlpha = new SynchedPropertySimpleOneWay(params.iconAlpha, this, "iconAlpha");
        this.settingDialogController = new CustomDialogController({
            builder: SettingDialog({
                itemData: this.itemData,
                action: () => this.confirmDialogController.open()
            }),
            autoCancel: false,
            alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
            offset: { dx: 0, dy: $r('app.float.setting_dialog_dy') },
            customStyle: true
        }, this);
        this.confirmDialogController = new CustomDialogController({
            builder: ConfirmDialog({
                title: $r('app.string.closeNovice'),
                bundleName: this.itemData.name,
                action: () => NotificationViewModel.enableNotification(this.itemData, false)
            }),
            autoCancel: false,
            alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
            offset: { dx: 0, dy: $r('app.float.confirm_dialog_dy') },
            customStyle: true
        }, this);
        this.iconConfigs = [
            {
                src: $r("app.media.ic_public_settings_filled"),
                callback: () => {
                    Log.showInfo(TAG, `click settings hashcode: ${this.itemData?.hashcode}`);
                    this.settingDialogController.open();
                }
            }, {
                src: $r("app.media.ic_public_delete_filled"),
                callback: () => {
                    if (!this.isGroup) {
                        Log.showInfo(TAG, `click delete hashcode: ${this.itemData?.hashcode}`);
                        NotificationViewModel.removeNotificationItem(this.itemData, true);
                    }
                    else {
                        Log.showInfo(TAG, `click delete groupName: ${this.itemData?.groupName}`);
                        NotificationViewModel.removeGroupNotification(this.itemData, true);
                    }
                }
            }
        ];
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: IconListComponent_Params) {
        if (params.itemData !== undefined) {
            this.itemData = params.itemData;
        }
        if (params.isGroup !== undefined) {
            this.isGroup = params.isGroup;
        }
        this.iconAlpha = params.iconAlpha;
        if (params.settingDialogController !== undefined) {
            this.settingDialogController = params.settingDialogController;
        }
        if (params.confirmDialogController !== undefined) {
            this.confirmDialogController = params.confirmDialogController;
        }
        if (params.iconConfigs !== undefined) {
            this.iconConfigs = params.iconConfigs;
        }
    }
    aboutToBeDeleted() {
        this.__iconAlpha.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private itemData: any;
    private isGroup: boolean;
    private __iconAlpha: SynchedPropertySimpleOneWay<number>;
    get iconAlpha() {
        return this.__iconAlpha.get();
    }
    set iconAlpha(newValue: number) {
        this.__iconAlpha.set(newValue);
    }
    private settingDialogController: CustomDialogController;
    private confirmDialogController: CustomDialogController;
    private iconConfigs: IconData[];
    aboutToAppear() {
        Log.showInfo(TAG, `iconConfigs: ${JSON.stringify(this.iconConfigs)}`);
        iconSize = this.iconConfigs.length;
    }
    aboutToDisappear() {
        delete this.settingDialogController;
        this.settingDialogController = undefined;
        delete this.confirmDialogController;
        this.confirmDialogController = undefined;
        Log.showInfo(TAG, 'aboutToDisappear');
    }
    render() {
        Flex.create({ direction: FlexDirection.Row, alignItems: ItemAlign.End, justifyContent: FlexAlign.End });
        Flex.margin({ left: Layout.ICON_MARGIN });
        ForEach.create("8", this, ObservedObject.GetRawObject(this.iconConfigs), (item) => {
            Button.createWithChild({ type: ButtonType.Circle, stateEffect: true });
            Button.width(Layout.BUTTON_SIZE);
            Button.height(Layout.BUTTON_SIZE);
            Button.opacity(this.iconAlpha);
            Button.backgroundColor($r("app.color.button_background"));
            Button.margin({ left: Layout.ICON_MARGIN, right: Layout.ICON_MARGIN });
            Button.onClick(() => item.callback && item.callback());
            If.create();
            if (item.src) {
                If.branchId(0);
                Image.create(item.src);
                Image.objectFit(ImageFit.Contain);
                Image.fillColor($r("sys.color.ohos_id_color_primary_contrary"));
                Image.width(Layout.ICON_SIZE);
                Image.height(Layout.ICON_SIZE);
            }
            If.pop();
            Button.pop();
        });
        ForEach.pop();
        Flex.pop();
    }
}
export class BottomLeftItem extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.itemData = {};
        this.bottomLeftItemHeight = 92;
        this.settingDialogController = new CustomDialogController({
            builder: SettingDialog({
                itemData: this.itemData,
                action: () => this.confirmDialogController.open()
            }),
            autoCancel: false,
            alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
            offset: { dx: 0, dy: $r('app.float.setting_dialog_dy') },
            customStyle: true
        }, this);
        this.confirmDialogController = new CustomDialogController({
            builder: ConfirmDialog({
                title: $r('app.string.closeNovice'),
                bundleName: this.itemData.name,
                action: () => NotificationViewModel.enableNotification(this.itemData, false)
            }),
            autoCancel: false,
            alignment: deviceTypeInfo === 'phone' ? DialogAlignment.Bottom : DialogAlignment.Default,
            offset: { dx: 0, dy: $r('app.float.confirm_dialog_dy') },
            customStyle: true
        }, this);
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: BottomLeftItem_Params) {
        if (params.itemData !== undefined) {
            this.itemData = params.itemData;
        }
        if (params.bottomLeftItemHeight !== undefined) {
            this.bottomLeftItemHeight = params.bottomLeftItemHeight;
        }
        if (params.settingDialogController !== undefined) {
            this.settingDialogController = params.settingDialogController;
        }
        if (params.confirmDialogController !== undefined) {
            this.confirmDialogController = params.confirmDialogController;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private itemData: any;
    private bottomLeftItemHeight: number;
    private settingDialogController: CustomDialogController;
    private confirmDialogController: CustomDialogController;
    aboutToDisappear() {
        delete this.settingDialogController;
        this.settingDialogController = undefined;
        delete this.confirmDialogController;
        this.confirmDialogController = undefined;
        Log.showInfo(TAG, 'BottomLeftItem -> aboutToDisappear');
    }
    render() {
        Row.create();
        Row.height(this.bottomLeftItemHeight);
        Row.justifyContent(FlexAlign.SpaceEvenly);
        Row.alignItems(VerticalAlign.Center);
        Button.createWithChild({ type: ButtonType.Circle, stateEffect: true });
        Button.backgroundColor($r("app.color.button_background"));
        Button.onClick(() => this.settingDialogController.open());
        Button.width(Layout.BUTTON_SIZE);
        Button.height(Layout.BUTTON_SIZE);
        Image.create($r("app.media.ic_public_settings_filled"));
        Image.objectFit(ImageFit.Contain);
        Image.fillColor($r("sys.color.ohos_id_color_primary_contrary"));
        Image.width(Layout.ICON_SIZE);
        Image.height(Layout.ICON_SIZE);
        Button.pop();
        Row.pop();
    }
}
