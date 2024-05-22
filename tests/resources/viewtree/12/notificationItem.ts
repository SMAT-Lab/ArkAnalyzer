if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
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
export default class NotificationItem extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__mIconAlpha = new ObservedPropertySimplePU(0, this, "mIconAlpha");
        this.__itemWidth = new ObservedPropertySimplePU('100%', this, "itemWidth");
        this.itemData = {};
        this.isSubItem = false;
        this.registerEventCapture = null;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: NotificationItem_Params) {
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
    updateStateVars(params: NotificationItem_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__mIconAlpha.purgeDependencyOnElmtId(rmElmtId);
        this.__itemWidth.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__mIconAlpha.aboutToBeDeleted();
        this.__itemWidth.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __mIconAlpha: ObservedPropertySimplePU<number>;
    get mIconAlpha() {
        return this.__mIconAlpha.get();
    }
    set mIconAlpha(newValue: number) {
        this.__mIconAlpha.set(newValue);
    }
    private __itemWidth: ObservedPropertySimplePU<string>;
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(this.itemWidth);
            Column.borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0);
            Column.clip(!this.isSubItem);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new FrontItem(parent ? parent : this, { itemData: this.itemData, isSubItem: this.isSubItem }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/notificationItem.ets", line: 53, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            itemData: this.itemData,
                            isSubItem: this.isSubItem
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "FrontItem" });
        }
        Column.pop();
    }
    BottomLeftComponent(parent = null) {
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new BottomLeftItem(parent ? parent : this, { itemData: this.itemData, bottomLeftItemHeight: 92 }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/notificationItem.ets", line: 61, col: 5 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            itemData: this.itemData,
                            bottomLeftItemHeight: 92
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "BottomLeftItem" });
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(this.itemWidth);
            Column.borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0);
            Column.clip(!this.isSubItem);
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SwipeLayout(this, {
                        swipeLayoutId: getId(this.itemData, false),
                        bottomLeftWidth: 80,
                        bottomRightWidth: 60,
                        leftThreshold: 100,
                        bottomHeight: 92,
                        deleteButtonCallback: this.deleteButtonCallback.bind(this),
                        SurfaceComponent: this.SurfaceComponent.bind(this),
                        BottomLeftComponent: this.BottomLeftComponent.bind(this),
                        registerEventCapture: this.registerNotificationItemEventCapture.bind(this)
                    }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/notificationItem.ets", line: 66, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            swipeLayoutId: getId(this.itemData, false),
                            bottomLeftWidth: 80,
                            bottomRightWidth: 60,
                            leftThreshold: 100,
                            bottomHeight: 92,
                            deleteButtonCallback: this.deleteButtonCallback.bind(this),
                            SurfaceComponent: this.SurfaceComponent.bind(this),
                            BottomLeftComponent: this.BottomLeftComponent.bind(this),
                            registerEventCapture: this.registerNotificationItemEventCapture.bind(this)
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "SwipeLayout" });
        }
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class FrontItem extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
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
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: FrontItem_Params) {
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
    updateStateVars(params: FrontItem_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.borderRadius(!this.isSubItem ? $r("sys.float.ohos_id_corner_radius_default_l") : 0);
            Column.backgroundColor($r('app.color.notificationitem_background'));
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.itemData.template?.name) {
                this.ifElseBranchUpdateFunction(0, () => {
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
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
    rerender() {
        this.updateDirtyElements();
    }
}
