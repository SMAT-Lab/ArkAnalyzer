interface FrontItem_Params {
    itemData?: any;
    nowWant?: any;
    isSubItem?: boolean;
    devicesDialogController?: CustomDialogController;
}
interface NotificationItem_Params {
    mIconAlpha?: number;
    itemWidth?: string;
    itemData?: any;
    isSubItem?: boolean;
    registerEventCapture?: (id: string) => boolean;
}
let __generate__Id: number = 0;
function generateId(): string {
    return "notificationItem_" + ++__generate__Id;
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
import GeneralItem from './generalItem';
import CustomItem from './customItem';
import Log from '../../../../../../../../../../common/src/main/ets/default/Log';
import NotificationViewModel from '../../viewmodel/NotificationViewModel';
import DevicesDialog from './devicesDialog';
import WantAgent from '@ohos.wantAgent';
import { BottomLeftItem } from './iconListComponent';
import deviceInfo from '@ohos.deviceInfo';
import SwipeLayout from './SwipeLayout';
import { getId } from '../../model/SwipeLayoutUtils';
const TAG = 'NoticeItem-NotificationItem';
const deviceTypeInfo = deviceInfo.deviceType;
export default class NotificationItem extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__mIconAlpha = new ObservedPropertySimple(0, this, "mIconAlpha");
        this.__itemWidth = new ObservedPropertySimple('100%', this, "itemWidth");
        this.itemData = {};
        this.isSubItem = false;
        this.registerEventCapture = null;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: NotificationItem_Params) {
        if (params.mIconAlpha !== undefined) {
            this.mIconAlpha = params.mIconAlpha;
        }
        if (params.itemWidth !== undefined) {
            this.itemWidth = params.itemWidth;
        }
        if (params.itemData !== undefined) {
            this.itemData = params.itemData;
        }
        if (params.isSubItem !== undefined) {
            this.isSubItem = params.isSubItem;
        }
        if (params.registerEventCapture !== undefined) {
            this.registerEventCapture = params.registerEventCapture;
        }
    }
    aboutToBeDeleted() {
        this.__mIconAlpha.aboutToBeDeleted();
        this.__itemWidth.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private __mIconAlpha: ObservedPropertySimple<number>;
    get mIconAlpha() {
        return this.__mIconAlpha.get();
    }
    set mIconAlpha(newValue: number) {
        this.__mIconAlpha.set(newValue);
    }
    private __itemWidth: ObservedPropertySimple<string>;
    get itemWidth() {
        return this.__itemWidth.get();
    }
    set itemWidth(newValue: string) {
        this.__itemWidth.set(newValue);
    }
    private itemData: any;
    private isSubItem: boolean;
    private registerEventCapture: (id: string) => boolean;
    registerNotificationItemEventCapture(id: string) {
        if (this.registerEventCapture != null && this.registerEventCapture(id)) {
            return true;
        }
        else {
            return false;
        }
    }
    deleteButtonCallback() {
        NotificationViewModel.removeNotificationItem(this.itemData, true);
    }
    SurfaceComponent(parent = null) {
        Column.create();
        Column.width(this.itemWidth);
        Column.borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0);
        Column.clip(!this.isSubItem);
        let earlierCreatedChild_10: FrontItem = ((parent ? parent : this) && (parent ? parent : this).findChildById) ? (parent ? parent : this).findChildById(generateId()) as FrontItem : undefined;
        if (earlierCreatedChild_10 == undefined) {
            View.create(new FrontItem("notificationItem_" + __generate__Id, parent ? parent : this, { itemData: this.itemData, isSubItem: this.isSubItem }));
        }
        else {
            earlierCreatedChild_10.updateWithValueParams({
                itemData: this.itemData, isSubItem: this.isSubItem
            });
            if (!earlierCreatedChild_10.needsUpdate()) {
                earlierCreatedChild_10.markStatic();
            }
            View.create(earlierCreatedChild_10);
        }
        Column.pop();
    }
    BottomLeftComponent(parent = null) {
        let earlierCreatedChild_11: BottomLeftItem = ((parent ? parent : this) && (parent ? parent : this).findChildById) ? (parent ? parent : this).findChildById(generateId()) as BottomLeftItem : undefined;
        if (earlierCreatedChild_11 == undefined) {
            View.create(new BottomLeftItem("notificationItem_" + __generate__Id, parent ? parent : this, { itemData: this.itemData, bottomLeftItemHeight: 92 }));
        }
        else {
            earlierCreatedChild_11.updateWithValueParams({
                itemData: this.itemData, bottomLeftItemHeight: 92
            });
            if (!earlierCreatedChild_11.needsUpdate()) {
                earlierCreatedChild_11.markStatic();
            }
            View.create(earlierCreatedChild_11);
        }
    }
    render() {
        Column.create();
        Column.width(this.itemWidth);
        Column.borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0);
        Column.clip(!this.isSubItem);
        let earlierCreatedChild_12: SwipeLayout = (this && this.findChildById) ? this.findChildById("12") as SwipeLayout : undefined;
        if (earlierCreatedChild_12 == undefined) {
            View.create(new SwipeLayout("12", this, {
                swipeLayoutId: getId(this.itemData, false),
                bottomLeftWidth: 80,
                bottomRightWidth: 60,
                leftThreshold: 100,
                bottomHeight: 92,
                deleteButtonCallback: this.deleteButtonCallback.bind(this),
                SurfaceComponent: this.SurfaceComponent.bind(this),
                BottomLeftComponent: this.BottomLeftComponent.bind(this),
                registerEventCapture: this.registerNotificationItemEventCapture.bind(this)
            }));
        }
        else {
            earlierCreatedChild_12.updateWithValueParams({
                swipeLayoutId: getId(this.itemData, false),
                bottomLeftWidth: 80,
                bottomRightWidth: 60,
                leftThreshold: 100,
                bottomHeight: 92,
                deleteButtonCallback: this.deleteButtonCallback.bind(this),
                SurfaceComponent: this.SurfaceComponent.bind(this),
                BottomLeftComponent: this.BottomLeftComponent.bind(this),
                registerEventCapture: this.registerNotificationItemEventCapture.bind(this)
            });
            View.create(earlierCreatedChild_12);
        }
        Column.pop();
    }
}
class FrontItem extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.itemData = {};
        this.nowWant = undefined;
        this.isSubItem = false;
        this.devicesDialogController = new CustomDialogController({
            builder: DevicesDialog({
                action: (deviceID) => this.selectedDevice(deviceID)
            }),
            autoCancel: false,
            offset: { dx: 0, dy: 200 }
        }, this);
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FrontItem_Params) {
        if (params.itemData !== undefined) {
            this.itemData = params.itemData;
        }
        if (params.nowWant !== undefined) {
            this.nowWant = params.nowWant;
        }
        if (params.isSubItem !== undefined) {
            this.isSubItem = params.isSubItem;
        }
        if (params.devicesDialogController !== undefined) {
            this.devicesDialogController = params.devicesDialogController;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private itemData: any;
    private nowWant: any;
    private isSubItem: boolean;
    private devicesDialogController: CustomDialogController;
    aboutToDisappear() {
        delete this.devicesDialogController;
        this.devicesDialogController = undefined;
        Log.showInfo(TAG, 'FrontItem -> aboutToDisappear');
    }
    render() {
        Column.create();
        Column.width('100%');
        Column.borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0);
        Column.backgroundColor($r('app.color.notificationitem_background'));
        If.create();
        if (this.itemData.template?.name) {
            If.branchId(0);
        }
        else {
            If.branchId(1);
        }
        If.pop();
        Column.pop();
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
                }
                else {
                    NotificationViewModel.clickItem(this.itemData);
                }
            });
        }
        else {
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
