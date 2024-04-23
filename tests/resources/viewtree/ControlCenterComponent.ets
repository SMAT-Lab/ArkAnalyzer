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
import StyleConfiguration, { ControlCenterComponentStyle, ControlCenterComplexToggleLayoutStyle,
  ControlCenterSimpleToggleLayoutStyle } from '../common/StyleConfiguration';
import ViewModel from '../viewmodel/ControlCenterVM';
import ComplexToggleLoadComponent from './ComplexToggleLoadComponent';
import SimpleToggleLoadComponent from './SimpleToggleLoadComponent';
import SimpleToggleLayoutEditComponent from './SimpleToggleLayoutEditComponent';

const TAG = 'Control-ControlCenter';
const TAG_ControlCenterComplexToggleLayout = 'Control-ControlCenterComplexToggleLayout';
const TAG_ControlCenterSimpleToggleLayout = 'Control-ControlCenterSimpleToggleLayout';

var mUniform;

@Component
export default struct ControlCenterComponent {
  private touchMoveCallback: Function;
  private modeChangeCallback: Function;
  @State mSimpleToggleColumnCount: number = Constants.DEFAULT_SIMPLE_TOGGLE_COLUMN_COUNT;
  private mControlCenterComponentConfig: ControlCenterConfig;
  @State mIsEditSimpleToggleLayout: boolean = false;
  @State style: ControlCenterComponentStyle = StyleConfiguration.getControlCenterComponentStyle();
  private mWidthPx: number = 0;
  private mDisplayingSimpleToggles: string[] = [];
  private mHidingSimpleToggles: string[] = [];
  private mDefaultDisplaySimpleToggles: string[] = [];
  private titleDisplayInside: boolean = false;
  private moduleName: string = ''

  aboutToAppear() {
    Log.showInfo(TAG, `aboutToAppear, mControlCenterComponentConfig: ${JSON.stringify(this.mControlCenterComponentConfig)}`);
    ViewModel.initViewModel(this.mControlCenterComponentConfig, this.moduleName)
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
    animateTo({
      duration: 300,
      tempo: 1.0,
      curve: Curve.Friction,
      delay: 0,
      iterations: 1,
      playMode: PlayMode.Normal,
      onFinish: () => {
        Log.showInfo(TAG, `setIsEditSimpleToggleLayout, show anim finish.`)
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

  build() {
    Column() {
      if (!this.mIsEditSimpleToggleLayout) {
        Column() {
          Column() {
            UpTitle({
              touchMoveCallback: (data) => {
                if (this.touchMoveCallback) {
                  this.touchMoveCallback(data)
                }
              },
              simpleToggleLayoutEditStartCallback: () => this.onSimpleToggleLayoutEditStart()
            })
          }
          .width('100%')
          .height(this.style.upTitleHeight)
          .margin({top:5})

          Row() {
            Column() {
              ControlCenterComplexToggleLayout()

              Column() {
                ControlCenterSimpleToggleLayout({
                  mColumnCount: this.mSimpleToggleColumnCount
                })
                Column().width('100%').height(this.style.simpleToggleLayoutMarginBottom)
                MyBrightness()
              }
              .width('100%')
              .margin({top: this.style.toggleAreaGap})
              .padding({top: this.style.simpleToggleLayoutMarginTop, bottom: this.style.brightnessMarginBottom})
              .borderRadius(this.style.componentBorderRadius)
              .clip(true)
              .backgroundColor(this.style.componentBackgroundColor)
            }
            .padding({left: this.style.marginLeft, right: this.style.marginRight})
          }
          .width('100%')
        }
        .width('100%')
        .transition({ type: TransitionType.Insert, opacity: 0, translate: { x: (-this.mWidthPx * 0.8) + 'px' } })
        .transition({ type: TransitionType.Delete, opacity: 0 })
      } else {
        Column() {
          SimpleToggleLayoutEditComponent({
            mDisplayingToggles: this.mDisplayingSimpleToggles,
            mHidingToggles: this.mHidingSimpleToggles,
            mDefaultDisplayToggles: this.mDefaultDisplaySimpleToggles,
            simpleToggleLayoutEditEndCallback: () => this.onSimpleToggleLayoutEditEnd(),
            onSaveDisplayingToggles: (toggles: string[]) => this.onSaveDisplayingToggles(toggles),
            mColumnCount: this.mSimpleToggleColumnCount,
            titleDisplayInside: this.titleDisplayInside
          })
        }
        .width('100%')
        .transition({ type: TransitionType.Insert, opacity: 0, translate: { x: this.mWidthPx * 0.8 + 'px' } })
        .transition({ type: TransitionType.Delete, opacity: 0 })
      }
    }
    .height('100%')
    .width('100%')
    .onAreaChange((e, e2) => {
      Log.showInfo(TAG, `onAreaChange, e: ${JSON.stringify(e)} e2: ${JSON.stringify(e2)}`);
      this.mWidthPx = vp2px(Number(e2.width))
    })
  }
}

@Component
struct ControlCenterComplexToggleLayout {
  @StorageLink('ControlCenterComplexToggleLayout') mComplexToggleLayout: string[] = [];
  @State style: ControlCenterComplexToggleLayoutStyle = StyleConfiguration.getControlCenterComplexToggleLayoutStyle();

  aboutToAppear() {
    Log.showInfo(TAG_ControlCenterComplexToggleLayout, `aboutToAppear, mComplexToggleLayout: ${this.mComplexToggleLayout} `)
  }

  aboutToDisappear() {
    Log.showInfo(TAG_ControlCenterComplexToggleLayout, `aboutToDisAppear`);
  }

  build() {
    Grid() {
      ForEach(this.mComplexToggleLayout, (componentName) => {
        GridItem() {
          ComplexToggleLoadComponent({
            keyId: componentName
          })
        }
        .width('100%')
        .height('100%')
      }, (componentName) => componentName)
    }
    .width('100%')
    .height(this.calcGridHeight(Math.ceil(this.mComplexToggleLayout.length / 2), this.style.rowHeight, this.style.rowGap))
    .columnsTemplate('1fr 1fr')
    .rowsTemplate(this.generateRowsTemplate(Math.ceil(this.mComplexToggleLayout.length / 2)))
    .rowsGap(this.style.rowGap + 'px')
    .columnsGap(this.style.columnGap)
  }

  calcGridHeight(rowCount, rowHeight, rowGap) {
    Log.showDebug(TAG_ControlCenterComplexToggleLayout, `calcGridHeight, rowCount: ${rowCount} rowHeight: ${rowHeight} rowGap: ${rowGap}`);
    let height = rowCount * rowHeight + (rowCount - 1) * rowGap;
    if (height < 0) {
      height = 0
    };
    Log.showDebug(TAG_ControlCenterComplexToggleLayout, `calcGridHeight, height: ${height}`);
    return height + 'px';
  }

  generateRowsTemplate(rowCount) {
    Log.showDebug(TAG_ControlCenterComplexToggleLayout, `generateRowsTemplate, rowCount: ${rowCount}`);
    let rowsTemplate = '1fr';
    for (let i = 1;i < rowCount; i++) {
      rowsTemplate += ' 1fr'
    };
    return rowsTemplate;
  }
}

@Component
struct ControlCenterSimpleToggleLayout {
  @Prop mColumnCount: number;
  @StorageLink('ControlCenterSimpleToggleLayout') mSimpleToggleLayout: string[] = [];
  @State style: ControlCenterSimpleToggleLayoutStyle = StyleConfiguration.getControlCenterSimpleToggleLayoutStyle();

  aboutToAppear() {
    Log.showInfo(TAG_ControlCenterSimpleToggleLayout, `aboutToAppear, mSimpleToggleLayout: ${this.mSimpleToggleLayout} `);
  }

  aboutToDisappear() {
    Log.showInfo(TAG_ControlCenterSimpleToggleLayout, `aboutToDisAppear`);
  }

  build() {
    Grid() {
      ForEach(this.mSimpleToggleLayout, (componentName) => {
        GridItem() {
          SimpleToggleLoadComponent({
            keyId: componentName
          })
        }.width('100%')
        .height('100%')
      }, (componentName) => componentName)
    }
    .width('100%')
    .height(this.calcGridHeight(Math.ceil(this.mSimpleToggleLayout.length / this.mColumnCount), this.style.rowHeight, this.style.rowGap))
    .margin({left: this.style.marginLeft, right: this.style.marginRight})
    .columnsTemplate(this.generateColumnsTemplate(this.mColumnCount))
    .rowsTemplate(this.generateRowsTemplate(Math.ceil(this.mSimpleToggleLayout.length / this.mColumnCount)))
    .rowsGap(this.style.rowGap + 'px')
    .columnsGap(this.style.columnGap)
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
    for (let i = 1;i < columnCount; i++) {
      columnsTemplate += ' 1fr';
    }
    return columnsTemplate;
  }

  generateRowsTemplate(rowCount) {
    Log.showDebug(TAG_ControlCenterSimpleToggleLayout, `generateRowsTemplate, rowCount: ${rowCount}`);
    let rowsTemplate = '1fr';
    for (let i = 1;i < rowCount; i++) {
      rowsTemplate += ' 1fr';
    }
    return rowsTemplate;
  }
}