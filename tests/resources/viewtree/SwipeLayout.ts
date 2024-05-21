interface SwipeLayout_Params {
    angelCalFlag?: boolean;
    responseSwipeEvent?: boolean;
    surfaceWidth?: number;
    rightThreshold?: number;
    startX?: number;
    startY?: number;
    lastTouchX?: number;
    rateSurface?: number;
    rateDelete?: number;
    eventCaptureFlag?: boolean;
    swipeLayoutId?: string;
    bottomLeftWidth?: number;
    bottomRightWidth?: number;
    leftThreshold?: number;
    bottomHeight?: number;
    deleteButtonCallback?: any;
    SurfaceComponent?: () => void;
    BottomLeftComponent?: () => void;
    registerEventCapture?: (id: string) => boolean;
    overallX?: number;
    surfaceX?: number;
    bottomLeftX?: number;
    deleteLeftX?: number;
    rotateAngel?: number;
    deleteButtonScale?: number;
    surfaceOpacity?: number;
    bottomLeftOpacity?: number;
    bottomRightOpacity?: number;
    bottomLeftWidthMoving?: number;
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
import Log from '../../../../../../../../../../common/src/main/ets/default/Log';
import Constants, { NotificationLayout as Layout } from '../../common/constants';
import FocusCallBack from '../../model/SwipeLayoutUtils';
const TAG = 'SwipeLayout';
export default class SwipeLayout extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.angelCalFlag = false;
        this.responseSwipeEvent = false;
        this.surfaceWidth = -1;
        this.rightThreshold = 0;
        this.startX = 0;
        this.startY = 0;
        this.lastTouchX = 0;
        this.rateSurface = 1 / 1.3;
        this.rateDelete = 1 / 6;
        this.eventCaptureFlag = true;
        this.swipeLayoutId = 'id default';
        this.bottomLeftWidth = 0;
        this.bottomRightWidth = 0;
        this.leftThreshold = 0;
        this.bottomHeight = 92;
        this.deleteButtonCallback = undefined;
        this.SurfaceComponent = undefined;
        this.BottomLeftComponent = undefined;
        this.registerEventCapture = null;
        this.__overallX = new ObservedPropertySimplePU(0, this, "overallX");
        this.__surfaceX = new ObservedPropertySimplePU(0, this, "surfaceX");
        this.__bottomLeftX = new ObservedPropertySimplePU(0, this, "bottomLeftX");
        this.__deleteLeftX = new ObservedPropertySimplePU(0, this, "deleteLeftX");
        this.__rotateAngel = new ObservedPropertySimplePU(0, this, "rotateAngel");
        this.__deleteButtonScale = new ObservedPropertySimplePU(1, this, "deleteButtonScale");
        this.__surfaceOpacity = new ObservedPropertySimplePU(1, this, "surfaceOpacity");
        this.__bottomLeftOpacity = new ObservedPropertySimplePU(0, this, "bottomLeftOpacity");
        this.__bottomRightOpacity = new ObservedPropertySimplePU(0, this, "bottomRightOpacity");
        this.__bottomLeftWidthMoving = new ObservedPropertySimplePU(0, this, "bottomLeftWidthMoving");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params: SwipeLayout_Params) {
        if (params.angelCalFlag !== undefined) {
            this.angelCalFlag = params.angelCalFlag;
        }
        if (params.responseSwipeEvent !== undefined) {
            this.responseSwipeEvent = params.responseSwipeEvent;
        }
        if (params.surfaceWidth !== undefined) {
            this.surfaceWidth = params.surfaceWidth;
        }
        if (params.rightThreshold !== undefined) {
            this.rightThreshold = params.rightThreshold;
        }
        if (params.startX !== undefined) {
            this.startX = params.startX;
        }
        if (params.startY !== undefined) {
            this.startY = params.startY;
        }
        if (params.lastTouchX !== undefined) {
            this.lastTouchX = params.lastTouchX;
        }
        if (params.rateSurface !== undefined) {
            this.rateSurface = params.rateSurface;
        }
        if (params.rateDelete !== undefined) {
            this.rateDelete = params.rateDelete;
        }
        if (params.eventCaptureFlag !== undefined) {
            this.eventCaptureFlag = params.eventCaptureFlag;
        }
        if (params.swipeLayoutId !== undefined) {
            this.swipeLayoutId = params.swipeLayoutId;
        }
        if (params.bottomLeftWidth !== undefined) {
            this.bottomLeftWidth = params.bottomLeftWidth;
        }
        if (params.bottomRightWidth !== undefined) {
            this.bottomRightWidth = params.bottomRightWidth;
        }
        if (params.leftThreshold !== undefined) {
            this.leftThreshold = params.leftThreshold;
        }
        if (params.bottomHeight !== undefined) {
            this.bottomHeight = params.bottomHeight;
        }
        if (params.deleteButtonCallback !== undefined) {
            this.deleteButtonCallback = params.deleteButtonCallback;
        }
        if (params.SurfaceComponent !== undefined) {
            this.SurfaceComponent = params.SurfaceComponent;
        }
        if (params.BottomLeftComponent !== undefined) {
            this.BottomLeftComponent = params.BottomLeftComponent;
        }
        if (params.registerEventCapture !== undefined) {
            this.registerEventCapture = params.registerEventCapture;
        }
        if (params.overallX !== undefined) {
            this.overallX = params.overallX;
        }
        if (params.surfaceX !== undefined) {
            this.surfaceX = params.surfaceX;
        }
        if (params.bottomLeftX !== undefined) {
            this.bottomLeftX = params.bottomLeftX;
        }
        if (params.deleteLeftX !== undefined) {
            this.deleteLeftX = params.deleteLeftX;
        }
        if (params.rotateAngel !== undefined) {
            this.rotateAngel = params.rotateAngel;
        }
        if (params.deleteButtonScale !== undefined) {
            this.deleteButtonScale = params.deleteButtonScale;
        }
        if (params.surfaceOpacity !== undefined) {
            this.surfaceOpacity = params.surfaceOpacity;
        }
        if (params.bottomLeftOpacity !== undefined) {
            this.bottomLeftOpacity = params.bottomLeftOpacity;
        }
        if (params.bottomRightOpacity !== undefined) {
            this.bottomRightOpacity = params.bottomRightOpacity;
        }
        if (params.bottomLeftWidthMoving !== undefined) {
            this.bottomLeftWidthMoving = params.bottomLeftWidthMoving;
        }
    }
    updateStateVars(params: SwipeLayout_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__overallX.purgeDependencyOnElmtId(rmElmtId);
        this.__surfaceX.purgeDependencyOnElmtId(rmElmtId);
        this.__bottomLeftX.purgeDependencyOnElmtId(rmElmtId);
        this.__deleteLeftX.purgeDependencyOnElmtId(rmElmtId);
        this.__rotateAngel.purgeDependencyOnElmtId(rmElmtId);
        this.__deleteButtonScale.purgeDependencyOnElmtId(rmElmtId);
        this.__surfaceOpacity.purgeDependencyOnElmtId(rmElmtId);
        this.__bottomLeftOpacity.purgeDependencyOnElmtId(rmElmtId);
        this.__bottomRightOpacity.purgeDependencyOnElmtId(rmElmtId);
        this.__bottomLeftWidthMoving.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__overallX.aboutToBeDeleted();
        this.__surfaceX.aboutToBeDeleted();
        this.__bottomLeftX.aboutToBeDeleted();
        this.__deleteLeftX.aboutToBeDeleted();
        this.__rotateAngel.aboutToBeDeleted();
        this.__deleteButtonScale.aboutToBeDeleted();
        this.__surfaceOpacity.aboutToBeDeleted();
        this.__bottomLeftOpacity.aboutToBeDeleted();
        this.__bottomRightOpacity.aboutToBeDeleted();
        this.__bottomLeftWidthMoving.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private angelCalFlag: boolean;
    private responseSwipeEvent: boolean;
    private surfaceWidth: number;
    private rightThreshold: number;
    private startX: number;
    private startY: number;
    private lastTouchX: number;
    private rateSurface: number;
    private rateDelete: number;
    private eventCaptureFlag: boolean;
    private swipeLayoutId: string;
    private bottomLeftWidth: number;
    private bottomRightWidth: number;
    private leftThreshold: number;
    private bottomHeight: number;
    private deleteButtonCallback: any;
    private __SurfaceComponent?;
    private __BottomLeftComponent?;
    private registerEventCapture: (id: string) => boolean;
    // Page offset, opacity, width height status variable.
    private __overallX: ObservedPropertySimplePU<number>;
    get overallX() {
        return this.__overallX.get();
    }
    set overallX(newValue: number) {
        this.__overallX.set(newValue);
    }
    private __surfaceX: ObservedPropertySimplePU<number>;
    get surfaceX() {
        return this.__surfaceX.get();
    }
    set surfaceX(newValue: number) {
        this.__surfaceX.set(newValue);
    }
    private __bottomLeftX: ObservedPropertySimplePU<number>;
    get bottomLeftX() {
        return this.__bottomLeftX.get();
    }
    set bottomLeftX(newValue: number) {
        this.__bottomLeftX.set(newValue);
    }
    private __deleteLeftX: ObservedPropertySimplePU<number>;
    get deleteLeftX() {
        return this.__deleteLeftX.get();
    }
    set deleteLeftX(newValue: number) {
        this.__deleteLeftX.set(newValue);
    }
    private __rotateAngel: ObservedPropertySimplePU<number>;
    get rotateAngel() {
        return this.__rotateAngel.get();
    }
    set rotateAngel(newValue: number) {
        this.__rotateAngel.set(newValue);
    }
    private __deleteButtonScale: ObservedPropertySimplePU<number>;
    get deleteButtonScale() {
        return this.__deleteButtonScale.get();
    }
    set deleteButtonScale(newValue: number) {
        this.__deleteButtonScale.set(newValue);
    }
    private __surfaceOpacity: ObservedPropertySimplePU<number>;
    get surfaceOpacity() {
        return this.__surfaceOpacity.get();
    }
    set surfaceOpacity(newValue: number) {
        this.__surfaceOpacity.set(newValue);
    }
    private __bottomLeftOpacity: ObservedPropertySimplePU<number>;
    get bottomLeftOpacity() {
        return this.__bottomLeftOpacity.get();
    }
    set bottomLeftOpacity(newValue: number) {
        this.__bottomLeftOpacity.set(newValue);
    }
    private __bottomRightOpacity: ObservedPropertySimplePU<number>;
    get bottomRightOpacity() {
        return this.__bottomRightOpacity.get();
    }
    set bottomRightOpacity(newValue: number) {
        this.__bottomRightOpacity.set(newValue);
    }
    private __bottomLeftWidthMoving: ObservedPropertySimplePU<number>;
    get bottomLeftWidthMoving() {
        return this.__bottomLeftWidthMoving.get();
    }
    set bottomLeftWidthMoving(newValue: number) {
        this.__bottomLeftWidthMoving.set(newValue);
    }
    initState(): void {
        this.rightThreshold = this.surfaceWidth - this.bottomLeftWidth - this.bottomRightWidth;
        this.bottomLeftWidthMoving = this.bottomLeftWidth;
        this.surfaceX = 0;
        this.bottomLeftX = 0 + this.surfaceWidth;
        this.deleteLeftX = 0 + this.surfaceWidth + this.bottomLeftWidth;
        this.surfaceOpacity = 1;
        ;
        this.bottomLeftOpacity = 1;
        ;
        this.bottomRightOpacity = 1;
        ;
        this.responseSwipeEvent = false;
        return;
    }
    loseFocusCallback() {
        Context.animateTo({
            duration: 200,
            curve: Curve.Friction,
            onFinish: () => {
            },
        }, () => {
            this.initState();
        });
    }
    deleteAnimation() {
        Context.animateTo({
            duration: 250,
            curve: Curve.Friction,
            onFinish: () => {
                this.deleteButtonCallback();
            },
        }, () => {
            this.overallX = -this.surfaceWidth - this.surfaceX;
            this.surfaceOpacity = 0;
            this.bottomLeftOpacity = 0;
            this.bottomRightOpacity = 0;
        });
    }
    aboutToAppear() {
        Log.showInfo(TAG, `aboutToAppear`);
    }
    aboutToDisappear() {
        Log.showInfo(TAG, `aboutToDisappear`);
        FocusCallBack.deleteCallback(this.swipeLayoutId);
    }
    initialRender() {
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            Row.width('100%');
            Row.onTouch((touchEvent: TouchEvent) => {
                if (touchEvent.type == TouchType.Down) {
                    if (this.registerEventCapture != null && this.registerEventCapture(this.swipeLayoutId)) {
                        // If the event is consumed by the parent component, the component does not proceed with subsequent logic.
                        // If none of the parent components at the upper level consume it, the component consumes it.
                        this.eventCaptureFlag = false;
                        return;
                    }
                    if (this.surfaceWidth == -1) {
                        this.surfaceWidth = Number(touchEvent.target.area.width);
                        this.initState();
                    }
                    this.responseSwipeEvent = false;
                    this.angelCalFlag = false; // Angle judgment flag bit
                    this.startX = touchEvent.touches[0].screenX;
                    this.startY = touchEvent.touches[0].screenY;
                    this.lastTouchX = touchEvent.touches[0].screenX;
                    if (!AppStorage.Has('swipelayout')) {
                        // By adding Appstorage verification, you can prevent the parent component from sliding when the nesting is used because the prevent bubbling event fails.
                        AppStorage.SetOrCreate('swipelayout', this.swipeLayoutId);
                    }
                }
                else if (touchEvent.type == TouchType.Move) {
                    if (this.eventCaptureFlag == false) {
                        return;
                    }
                    if (AppStorage.Get('swipelayout') != this.swipeLayoutId) {
                        return;
                    }
                    if (this.angelCalFlag == false) {
                        var hasChange = Math.abs(touchEvent.touches[0].screenX - this.startX) > 1e-3 ||
                            Math.abs(touchEvent.touches[0].screenY - this.startY) > 1e-3;
                        if (hasChange) {
                            this.responseSwipeEvent = (Math.abs(touchEvent.touches[0].screenX - this.startX) > Math.abs(touchEvent.touches[0].screenY - this.startY));
                            this.angelCalFlag = true;
                            FocusCallBack.setCallback(this.swipeLayoutId, this.loseFocusCallback.bind(this));
                        }
                    }
                    if (this.responseSwipeEvent == false) {
                        return;
                    }
                    touchEvent.stopPropagation();
                    // Calculate the distance following your finger.
                    let followHand = this.rateSurface * (touchEvent.touches[0].screenX - this.lastTouchX);
                    this.surfaceX = this.surfaceX + followHand;
                    this.bottomLeftX = this.bottomLeftX + followHand;
                    if (this.bottomLeftX > this.rightThreshold) {
                        // 1. To the right of the right threshold, the underlying icon has not yet fully entered the screen
                        this.rotateAngel = 0;
                        this.deleteButtonScale = 1;
                        this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidth;
                    }
                    else if (this.bottomLeftX > this.leftThreshold && this.bottomLeftX < this.rightThreshold) {
                        // 2. Within the threshold on the left and the threshold on the right
                        if (this.bottomLeftOpacity == 0) {
                            Context.animateTo({
                                duration: 200,
                                curve: Curve.Friction,
                                onFinish: () => {
                                },
                            }, () => {
                                this.bottomLeftOpacity = 1;
                                this.bottomLeftWidthMoving = (this.rightThreshold - this.bottomLeftX) * (1 - this.rateDelete) + this.bottomLeftWidth;
                                this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidthMoving;
                                this.rotateAngel = 12 - 12 * (this.bottomLeftX - this.leftThreshold) / (this.rightThreshold - this.leftThreshold);
                                this.deleteButtonScale = 1.05 - 0.05 * (this.bottomLeftX - this.leftThreshold) / (this.rightThreshold - this.leftThreshold);
                            });
                        }
                        else {
                            this.bottomLeftWidthMoving = (this.rightThreshold - this.bottomLeftX) * (1 - this.rateDelete) + this.bottomLeftWidth;
                            this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidthMoving;
                            this.rotateAngel = 12 - 12 * (this.bottomLeftX - this.leftThreshold) / (this.rightThreshold - this.leftThreshold);
                            this.deleteButtonScale = 1.05 - 0.05 * (this.bottomLeftX - this.leftThreshold) / (this.rightThreshold - this.leftThreshold);
                        }
                    }
                    else {
                        // 3. Less than the leftmost threshold
                        if (this.bottomLeftOpacity == 1) {
                            Context.animateTo({
                                duration: 200,
                                curve: Curve.Friction,
                                onFinish: () => {
                                },
                            }, () => {
                                this.bottomLeftOpacity = 0;
                                this.deleteLeftX = (this.bottomLeftX + this.surfaceWidth) / 2 - this.deleteButtonScale * Layout.BUTTON_SIZE / 2;
                                this.rotateAngel = 17;
                                this.deleteButtonScale = 1.2;
                            });
                        }
                        else {
                            this.deleteLeftX = (this.bottomLeftX + this.surfaceWidth) / 2 - this.deleteButtonScale * Layout.BUTTON_SIZE / 2;
                        }
                    }
                    this.lastTouchX = touchEvent.touches[0].screenX;
                }
                else if (touchEvent.type == TouchType.Up) {
                    this.eventCaptureFlag = true;
                    AppStorage.Delete('swipelayout');
                    if (this.responseSwipeEvent == false) {
                        return;
                    }
                    if (this.bottomLeftX > this.rightThreshold) {
                        FocusCallBack.deleteCallback(this.swipeLayoutId);
                        Context.animateTo({
                            duration: 200,
                            curve: Curve.Friction,
                            onFinish: () => {
                            },
                        }, () => {
                            this.surfaceX = 0;
                            this.bottomLeftX = 0 + this.surfaceWidth;
                            this.deleteLeftX = 0 + this.surfaceWidth + this.bottomLeftWidth;
                        });
                    }
                    else if (this.bottomLeftX > this.leftThreshold && this.bottomLeftX < this.rightThreshold) {
                        Context.animateTo({
                            duration: 300,
                            curve: Curve.Friction,
                            onFinish: () => {
                            },
                        }, () => {
                            this.bottomLeftOpacity = 1;
                            this.bottomLeftX = this.rightThreshold;
                            this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidth;
                            this.surfaceX = this.bottomLeftX - this.surfaceWidth;
                            this.bottomLeftWidthMoving = this.bottomLeftWidth;
                            this.rotateAngel = 0;
                        });
                    }
                    else {
                        this.deleteButtonCallback();
                    }
                }
            });
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            Row.width('100%');
            Row.offset({ x: this.overallX });
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            //Surface Component
            Row.create();
            //Surface Component
            Row.zIndex(1);
            //Surface Component
            Row.width('100%');
            //Surface Component
            Row.offset({ x: this.surfaceX });
            //Surface Component
            Row.opacity(this.surfaceOpacity);
            if (!isInitialRender) {
                //Surface Component
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.SurfaceComponent.bind(this)();
        //Surface Component
        Row.pop();
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            //Bottom Left Component
            Row.create();
            //Bottom Left Component
            Row.justifyContent(FlexAlign.Center);
            //Bottom Left Component
            Row.width(this.bottomLeftWidthMoving);
            //Bottom Left Component
            Row.opacity(this.bottomLeftOpacity);
            //Bottom Left Component
            Row.offset({ x: this.bottomLeftX - this.surfaceWidth });
            //Bottom Left Component
            Row.zIndex(0);
            if (!isInitialRender) {
                //Bottom Left Component
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.BottomLeftComponent.bind(this)();
        //Bottom Left Component
        Row.pop();
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            Row.opacity(this.bottomRightOpacity);
            Row.width(Layout.BUTTON_SIZE);
            Row.height(this.bottomHeight);
            Row.clip(false);
            Row.offset({ x: this.deleteLeftX - this.surfaceWidth - this.bottomLeftWidthMoving });
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Button.createWithChild({ type: ButtonType.Circle, stateEffect: true });
            Button.backgroundColor($r("app.color.button_background"));
            Button.zIndex(1);
            Button.onClick(() => this.deleteAnimation());
            Button.width(Layout.BUTTON_SIZE);
            Button.height(Layout.BUTTON_SIZE);
            Button.scale({
                x: this.deleteButtonScale,
                y: this.deleteButtonScale,
                z: 1,
                centerX: '50%',
                centerY: '50%'
            });
            if (!isInitialRender) {
                Button.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Stack.create();
            Stack.width(Layout.ICON_SIZE);
            Stack.height(Layout.ICON_SIZE);
            if (!isInitialRender) {
                Stack.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Image.create($r("app.media.ic_public_delete_lids_filled"));
            Image.objectFit(ImageFit.Contain);
            Image.fillColor({ "id": 125829189, "type": 10001, params: [] });
            Image.width(Layout.ICON_SIZE);
            Image.height(Layout.ICON_SIZE);
            Image.rotate({
                x: 0,
                y: 0,
                z: 1,
                centerX: '89.45%',
                centerY: '17.71%',
                angle: this.rotateAngel
            });
            if (!isInitialRender) {
                Image.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Image.create($r("app.media.ic_public_delete_body_filled"));
            Image.objectFit(ImageFit.Contain);
            Image.fillColor({ "id": 125829189, "type": 10001, params: [] });
            Image.width(Layout.ICON_SIZE);
            Image.height(Layout.ICON_SIZE);
            Image.rotate({
                x: 0,
                y: 0,
                z: 1,
                centerX: '82.94%',
                centerY: '29.17%',
                angle: -this.rotateAngel
            });
            if (!isInitialRender) {
                Image.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Stack.pop();
        Button.pop();
        Row.pop();
        Row.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new ParentComponent(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
