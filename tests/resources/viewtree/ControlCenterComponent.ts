interface ControlCenterSimpleToggleLayout_Params {
    mColumnCount?: number;
    mSimpleToggleLayout?: string[];
    style?: ControlCenterSimpleToggleLayoutStyle;
}
interface ControlCenterComplexToggleLayout_Params {
    mComplexToggleLayout?: string[];
    style?: ControlCenterComplexToggleLayoutStyle;
}
interface ControlCenterComponent_Params {
    touchMoveCallback?: Function;
    modeChangeCallback?: Function;
    mSimpleToggleColumnCount?: number;
    mControlCenterComponentConfig?: ControlCenterConfig;
    mIsEditSimpleToggleLayout?: boolean;
    style?: ControlCenterComponentStyle;
    mWidthPx?: number;
    mDisplayingSimpleToggles?: string[];
    mHidingSimpleToggles?: string[];
    mDefaultDisplaySimpleToggles?: string[];
    titleDisplayInside?: boolean;
    moduleName?: string;
}
let __generate__Id: number = 0;
function generateId(): string {
    return "ControlCenterComponent_" + ++__generate__Id;
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
import UpTitle from './UpTitle';
import MyBrightness from '../../../../../../../brightnesscomponent/src/main/ets/default/pages/brightnessComponent';
import Log from '../../../../../../../../common/src/main/ets/default/Log';
import Constants, { ControlCenterConfig } from '../common/Constants';
import StyleConfiguration, { ControlCenterComponentStyle, ControlCenterComplexToggleLayoutStyle, ControlCenterSimpleToggleLayoutStyle } from '../common/StyleConfiguration';
import ViewModel from '../viewmodel/ControlCenterVM';
import ComplexToggleLoadComponent from './ComplexToggleLoadComponent';
import SimpleToggleLoadComponent from './SimpleToggleLoadComponent';
import SimpleToggleLayoutEditComponent from './SimpleToggleLayoutEditComponent';
const TAG = 'Control-ControlCenter';
const TAG_ControlCenterComplexToggleLayout = 'Control-ControlCenterComplexToggleLayout';
const TAG_ControlCenterSimpleToggleLayout = 'Control-ControlCenterSimpleToggleLayout';
var mUniform;
export default class ControlCenterComponent extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.touchMoveCallback = undefined;
        this.modeChangeCallback = undefined;
        this.__mSimpleToggleColumnCount = new ObservedPropertySimple(Constants.DEFAULT_SIMPLE_TOGGLE_COLUMN_COUNT, this, "mSimpleToggleColumnCount");
        this.mControlCenterComponentConfig = undefined;
        this.__mIsEditSimpleToggleLayout = new ObservedPropertySimple(false, this, "mIsEditSimpleToggleLayout");
        this.__style = new ObservedPropertyObject(StyleConfiguration.getControlCenterComponentStyle(), this, "style");
        this.mWidthPx = 0;
        this.mDisplayingSimpleToggles = [];
        this.mHidingSimpleToggles = [];
        this.mDefaultDisplaySimpleToggles = [];
        this.titleDisplayInside = false;
        this.moduleName = '';
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: ControlCenterComponent_Params) {
        if (params.touchMoveCallback !== undefined) {
            this.touchMoveCallback = params.touchMoveCallback;
        }
        if (params.modeChangeCallback !== undefined) {
            this.modeChangeCallback = params.modeChangeCallback;
        }
        if (params.mSimpleToggleColumnCount !== undefined) {
            this.mSimpleToggleColumnCount = params.mSimpleToggleColumnCount;
        }
        if (params.mControlCenterComponentConfig !== undefined) {
            this.mControlCenterComponentConfig = params.mControlCenterComponentConfig;
        }
        if (params.mIsEditSimpleToggleLayout !== undefined) {
            this.mIsEditSimpleToggleLayout = params.mIsEditSimpleToggleLayout;
        }
        if (params.style !== undefined) {
            this.style = params.style;
        }
        if (params.mWidthPx !== undefined) {
            this.mWidthPx = params.mWidthPx;
        }
        if (params.mDisplayingSimpleToggles !== undefined) {
            this.mDisplayingSimpleToggles = params.mDisplayingSimpleToggles;
        }
        if (params.mHidingSimpleToggles !== undefined) {
            this.mHidingSimpleToggles = params.mHidingSimpleToggles;
        }
        if (params.mDefaultDisplaySimpleToggles !== undefined) {
            this.mDefaultDisplaySimpleToggles = params.mDefaultDisplaySimpleToggles;
        }
        if (params.titleDisplayInside !== undefined) {
            this.titleDisplayInside = params.titleDisplayInside;
        }
        if (params.moduleName !== undefined) {
            this.moduleName = params.moduleName;
        }
    }
    aboutToBeDeleted() {
        this.__mSimpleToggleColumnCount.aboutToBeDeleted();
        this.__mIsEditSimpleToggleLayout.aboutToBeDeleted();
        this.__style.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private touchMoveCallback: Function;
    private modeChangeCallback: Function;
    private __mSimpleToggleColumnCount: ObservedPropertySimple<number>;
    get mSimpleToggleColumnCount() {
        return this.__mSimpleToggleColumnCount.get();
    }
    set mSimpleToggleColumnCount(newValue: number) {
        this.__mSimpleToggleColumnCount.set(newValue);
    }
    private mControlCenterComponentConfig: ControlCenterConfig;
    private __mIsEditSimpleToggleLayout: ObservedPropertySimple<boolean>;
    get mIsEditSimpleToggleLayout() {
        return this.__mIsEditSimpleToggleLayout.get();
    }
    set mIsEditSimpleToggleLayout(newValue: boolean) {
        this.__mIsEditSimpleToggleLayout.set(newValue);
    }
    private __style: ObservedPropertyObject<ControlCenterComponentStyle>;
    get style() {
        return this.__style.get();
    }
    set style(newValue: ControlCenterComponentStyle) {
        this.__style.set(newValue);
    }
    private mWidthPx: number;
    private mDisplayingSimpleToggles: string[];
    private mHidingSimpleToggles: string[];
    private mDefaultDisplaySimpleToggles: string[];
    private titleDisplayInside: boolean;
    private moduleName: string;
    aboutToAppear() {
        Log.showInfo(TAG, `aboutToAppear, mControlCenterComponentConfig: ${JSON.stringify(this.mControlCenterComponentConfig)}`);
        ViewModel.initViewModel(this.mControlCenterComponentConfig, this.moduleName);
    }
    aboutToDisappear() {
        Log.showInfo(TAG, 'aboutToDisappear');
    }
    onSimpleToggleLayoutEditStart() {
        Log.showDebug(TAG, 'onSimpleToggleLayoutEditStart');
        this.mDisplayingSimpleToggles = ViewModel.getDisplayingSimpleToggles();
        this.mHidingSimpleToggles = ViewModel.getHidingSimpleToggles();
        this.mDefaultDisplaySimpleToggles = ViewModel.getDefaultSimpleToggleLayout();
        this.setIsEditSimpleToggleLayout(true);
    }
    onSimpleToggleLayoutEditEnd() {
        Log.showDebug(TAG, 'onSimpleToggleLayoutEditEnd');
        this.setIsEditSimpleToggleLayout(false);
    }
    setIsEditSimpleToggleLayout(isEdit: boolean): void {
        Log.showDebug(TAG, `setIsEditSimpleToggleLayout, isEdit: ${isEdit}`);
        Context.animateTo({
            duration: 300,
            tempo: 1.0,
            curve: Curve.Friction,
            delay: 0,
            iterations: 1,
            playMode: PlayMode.Normal,
            onFinish: () => {
                Log.showInfo(TAG, `setIsEditSimpleToggleLayout, show anim finish.`);
            }
        }, () => {
            Log.showInfo(TAG, `setIsEditSimpleToggleLayout, animateTo`);
            this.mIsEditSimpleToggleLayout = isEdit;
        });
        Log.showDebug(TAG, `this.modeChangeCallback: ${this.modeChangeCallback}`);
        if (this.modeChangeCallback) {
            this.modeChangeCallback(isEdit);
        }
    }
    onSaveDisplayingToggles(toggles: string[]): void {
        Log.showDebug(TAG, `onSaveDisplayingToggles, toggles: ${JSON.stringify(toggles)}`);
        ViewModel.saveSimpleToggleLayout(toggles);
    }
    render() {
        Column.create();
        Column.height('100%');
        Column.width('100%');
        Column.onAreaChange((e, e2) => {
            Log.showInfo(TAG, `onAreaChange, e: ${JSON.stringify(e)} e2: ${JSON.stringify(e2)}`);
            this.mWidthPx = vp2px(Number(e2.width));
        });
        If.create();
        if (!this.mIsEditSimpleToggleLayout) {
            If.branchId(0);
            Column.create();
            Column.width('100%');
            Column.transition({ type: TransitionType.Insert, opacity: 0, translate: { x: (-this.mWidthPx * 0.8) + 'px' } });
            Column.transition({ type: TransitionType.Delete, opacity: 0 });
            Column.create();
            Column.width('100%');
            Column.height(this.style.upTitleHeight);
            Column.margin({ top: 5 });
            Column.pop();
            Row.create();
            Row.width('100%');
            Column.create();
            Column.padding({ left: this.style.marginLeft, right: this.style.marginRight });
            let earlierCreatedChild_2: ControlCenterComplexToggleLayout = (this && this.findChildById) ? this.findChildById("2") as ControlCenterComplexToggleLayout : undefined;
            if (earlierCreatedChild_2 == undefined) {
                View.create(new ControlCenterComplexToggleLayout("2", this, {}));
            }
            else {
                earlierCreatedChild_2.updateWithValueParams({});
                View.create(earlierCreatedChild_2);
            }
            Column.create();
            Column.width('100%');
            Column.margin({ top: this.style.toggleAreaGap });
            Column.padding({ top: this.style.simpleToggleLayoutMarginTop, bottom: this.style.brightnessMarginBottom });
            Column.borderRadius(this.style.componentBorderRadius);
            Column.clip(true);
            Column.backgroundColor(this.style.componentBackgroundColor);
            let earlierCreatedChild_3: ControlCenterSimpleToggleLayout = (this && this.findChildById) ? this.findChildById("3") as ControlCenterSimpleToggleLayout : undefined;
            if (earlierCreatedChild_3 == undefined) {
                View.create(new ControlCenterSimpleToggleLayout("3", this, {
                    mColumnCount: this.mSimpleToggleColumnCount
                }));
            }
            else {
                earlierCreatedChild_3.updateWithValueParams({
                    mColumnCount: this.mSimpleToggleColumnCount
                });
                View.create(earlierCreatedChild_3);
            }
            Column.create();
            Column.width('100%');
            Column.height(this.style.simpleToggleLayoutMarginBottom);
            Column.pop();
            Column.pop();
            Column.pop();
            Row.pop();
            Column.pop();
        }
        else {
            If.branchId(1);
            Column.create();
            Column.width('100%');
            Column.transition({ type: TransitionType.Insert, opacity: 0, translate: { x: this.mWidthPx * 0.8 + 'px' } });
            Column.transition({ type: TransitionType.Delete, opacity: 0 });
            Column.pop();
        }
        If.pop();
        Column.pop();
    }
}
class ControlCenterComplexToggleLayout extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__mComplexToggleLayout = AppStorage.SetAndLink('ControlCenterComplexToggleLayout', [], this, "mComplexToggleLayout");
        this.__style = new ObservedPropertyObject(StyleConfiguration.getControlCenterComplexToggleLayoutStyle(), this, "style");
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: ControlCenterComplexToggleLayout_Params) {
        if (params.style !== undefined) {
            this.style = params.style;
        }
    }
    aboutToBeDeleted() {
        this.__mComplexToggleLayout.aboutToBeDeleted();
        this.__style.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private __mComplexToggleLayout: ObservedPropertyAbstract<string[]>;
    get mComplexToggleLayout() {
        return this.__mComplexToggleLayout.get();
    }
    set mComplexToggleLayout(newValue: string[]) {
        this.__mComplexToggleLayout.set(newValue);
    }
    private __style: ObservedPropertyObject<ControlCenterComplexToggleLayoutStyle>;
    get style() {
        return this.__style.get();
    }
    set style(newValue: ControlCenterComplexToggleLayoutStyle) {
        this.__style.set(newValue);
    }
    aboutToAppear() {
        Log.showInfo(TAG_ControlCenterComplexToggleLayout, `aboutToAppear, mComplexToggleLayout: ${this.mComplexToggleLayout} `);
    }
    aboutToDisappear() {
        Log.showInfo(TAG_ControlCenterComplexToggleLayout, `aboutToDisAppear`);
    }
    render() {
        Grid.create();
        Grid.width('100%');
        Grid.height(this.calcGridHeight(Math.ceil(this.mComplexToggleLayout.length / 2), this.style.rowHeight, this.style.rowGap));
        Grid.columnsTemplate('1fr 1fr');
        Grid.rowsTemplate(this.generateRowsTemplate(Math.ceil(this.mComplexToggleLayout.length / 2)));
        Grid.rowsGap(this.style.rowGap + 'px');
        Grid.columnsGap(this.style.columnGap);
        ForEach.create("4", this, ObservedObject.GetRawObject(this.mComplexToggleLayout), (componentName) => {
            GridItem.create();
            GridItem.width('100%');
            GridItem.height('100%');
            GridItem.pop();
        }, (componentName) => componentName);
        ForEach.pop();
        Grid.pop();
    }
    calcGridHeight(rowCount, rowHeight, rowGap) {
        Log.showDebug(TAG_ControlCenterComplexToggleLayout, `calcGridHeight, rowCount: ${rowCount} rowHeight: ${rowHeight} rowGap: ${rowGap}`);
        let height = rowCount * rowHeight + (rowCount - 1) * rowGap;
        if (height < 0) {
            height = 0;
        }
        ;
        Log.showDebug(TAG_ControlCenterComplexToggleLayout, `calcGridHeight, height: ${height}`);
        return height + 'px';
    }
    generateRowsTemplate(rowCount) {
        Log.showDebug(TAG_ControlCenterComplexToggleLayout, `generateRowsTemplate, rowCount: ${rowCount}`);
        let rowsTemplate = '1fr';
        for (let i = 1; i < rowCount; i++) {
            rowsTemplate += ' 1fr';
        }
        ;
        return rowsTemplate;
    }
}
class ControlCenterSimpleToggleLayout extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__mColumnCount = new SynchedPropertySimpleOneWay(params.mColumnCount, this, "mColumnCount");
        this.__mSimpleToggleLayout = AppStorage.SetAndLink('ControlCenterSimpleToggleLayout', [], this, "mSimpleToggleLayout");
        this.__style = new ObservedPropertyObject(StyleConfiguration.getControlCenterSimpleToggleLayoutStyle(), this, "style");
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: ControlCenterSimpleToggleLayout_Params) {
        this.mColumnCount = params.mColumnCount;
        if (params.style !== undefined) {
            this.style = params.style;
        }
    }
    aboutToBeDeleted() {
        this.__mColumnCount.aboutToBeDeleted();
        this.__mSimpleToggleLayout.aboutToBeDeleted();
        this.__style.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private __mColumnCount: SynchedPropertySimpleOneWay<number>;
    get mColumnCount() {
        return this.__mColumnCount.get();
    }
    set mColumnCount(newValue: number) {
        this.__mColumnCount.set(newValue);
    }
    private __mSimpleToggleLayout: ObservedPropertyAbstract<string[]>;
    get mSimpleToggleLayout() {
        return this.__mSimpleToggleLayout.get();
    }
    set mSimpleToggleLayout(newValue: string[]) {
        this.__mSimpleToggleLayout.set(newValue);
    }
    private __style: ObservedPropertyObject<ControlCenterSimpleToggleLayoutStyle>;
    get style() {
        return this.__style.get();
    }
    set style(newValue: ControlCenterSimpleToggleLayoutStyle) {
        this.__style.set(newValue);
    }
    aboutToAppear() {
        Log.showInfo(TAG_ControlCenterSimpleToggleLayout, `aboutToAppear, mSimpleToggleLayout: ${this.mSimpleToggleLayout} `);
    }
    aboutToDisappear() {
        Log.showInfo(TAG_ControlCenterSimpleToggleLayout, `aboutToDisAppear`);
    }
    render() {
        Grid.create();
        Grid.width('100%');
        Grid.height(this.calcGridHeight(Math.ceil(this.mSimpleToggleLayout.length / this.mColumnCount), this.style.rowHeight, this.style.rowGap));
        Grid.margin({ left: this.style.marginLeft, right: this.style.marginRight });
        Grid.columnsTemplate(this.generateColumnsTemplate(this.mColumnCount));
        Grid.rowsTemplate(this.generateRowsTemplate(Math.ceil(this.mSimpleToggleLayout.length / this.mColumnCount)));
        Grid.rowsGap(this.style.rowGap + 'px');
        Grid.columnsGap(this.style.columnGap);
        ForEach.create("5", this, ObservedObject.GetRawObject(this.mSimpleToggleLayout), (componentName) => {
            GridItem.create();
            GridItem.width('100%');
            GridItem.height('100%');
            GridItem.pop();
        }, (componentName) => componentName);
        ForEach.pop();
        Grid.pop();
    }
    calcGridHeight(rowCount, rowHeight, rowGap) {
        Log.showDebug(TAG_ControlCenterSimpleToggleLayout, `calcGridHeight, rowCount: ${rowCount} rowHeight: ${rowHeight} rowGap: ${rowGap}`);
        let height = rowCount * rowHeight + (rowCount - 1) * rowGap;
        if (height < 0) {
            height = 0;
        }
        Log.showDebug(TAG_ControlCenterSimpleToggleLayout, `calcGridHeight, height: ${height}`);
        return height + 'px';
    }
    generateColumnsTemplate(columnCount) {
        Log.showDebug(TAG_ControlCenterSimpleToggleLayout, `generateColumnsTemplate, columnCount: ${columnCount}`);
        let columnsTemplate = '1fr';
        for (let i = 1; i < columnCount; i++) {
            columnsTemplate += ' 1fr';
        }
        return columnsTemplate;
    }
    generateRowsTemplate(rowCount) {
        Log.showDebug(TAG_ControlCenterSimpleToggleLayout, `generateRowsTemplate, rowCount: ${rowCount}`);
        let rowsTemplate = '1fr';
        for (let i = 1; i < rowCount; i++) {
            rowsTemplate += ' 1fr';
        }
        return rowsTemplate;
    }
}
