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
import Constants, {NotificationLayout as Layout} from '../../common/constants';
import FocusCallBack from '../../model/SwipeLayoutUtils';

const TAG = 'SwipeLayout';

@Component
export default struct SwipeLayout {
  angelCalFlag: boolean = false;
  responseSwipeEvent: boolean = false;
  surfaceWidth: number = -1;
  rightThreshold: number = 0;
  startX: number = 0;
  startY: number = 0;
  lastTouchX: number = 0;
  rateSurface: number = 1/1.3;
  rateDelete: number = 1/6;
  eventCaptureFlag: boolean = true;

  swipeLayoutId: string = 'id default';
  bottomLeftWidth: number = 0;
  bottomRightWidth: number = 0;
  leftThreshold: number = 0;
  bottomHeight: number = 92;
  deleteButtonCallback: any;
  @BuilderParam SurfaceComponent?: () => void;
  @BuilderParam BottomLeftComponent?: () => void;
  registerEventCapture: (id: string) => boolean = null;

  // Page offset, opacity, width height status variable.
  @State overallX: number = 0;
  @State surfaceX: number = 0;
  @State bottomLeftX: number = 0;
  @State deleteLeftX: number = 0;
  @State rotateAngel: number = 0;
  @State deleteButtonScale: number = 1;
  @State surfaceOpacity: number = 1;
  @State bottomLeftOpacity: number = 0;
  @State bottomRightOpacity: number = 0;
  @State bottomLeftWidthMoving: number = 0;

  initState(): void{
    this.rightThreshold= this.surfaceWidth - this.bottomLeftWidth -this.bottomRightWidth;
    this.bottomLeftWidthMoving = this.bottomLeftWidth;
    this.surfaceX = 0;
    this.bottomLeftX = 0 + this.surfaceWidth;
    this.deleteLeftX = 0 + this.surfaceWidth + this.bottomLeftWidth;
    this.surfaceOpacity = 1;;
    this.bottomLeftOpacity = 1;;
    this.bottomRightOpacity = 1;;
    this.responseSwipeEvent = false;
    return;
  }

  loseFocusCallback(){
    animateTo({
      duration: 200,
      curve: Curve.Friction,
      onFinish: () => {
      },
    }, () => {
      this.initState();
    })
  }

  deleteAnimation(){
    animateTo({
      duration: 250,
      curve: Curve.Friction,
      onFinish: () => {
        this.deleteButtonCallback();
      },
    }, () => {
      this.overallX = - this.surfaceWidth - this.surfaceX;
      this.surfaceOpacity = 0;
      this.bottomLeftOpacity = 0;
      this.bottomRightOpacity = 0;
    })
  }

  aboutToAppear(){
    Log.showInfo(TAG, `aboutToAppear`);
  }

  aboutToDisappear(){
    Log.showInfo(TAG, `aboutToDisappear`);
    FocusCallBack.deleteCallback(this.swipeLayoutId);
  }

  build(){
    Row(){
      Row() {
        //Surface Component
        Row() {
          this.SurfaceComponent()
        }
        .zIndex(1)
        .width('100%')
        .offset({ x: this.surfaceX })
        .opacity(this.surfaceOpacity)

        //Bottom Left Component
        Row() {
          this.BottomLeftComponent()
        }
        .justifyContent(FlexAlign.Center)
        .width(this.bottomLeftWidthMoving)
        .opacity(this.bottomLeftOpacity)
        .offset({ x: this.bottomLeftX - this.surfaceWidth })
        .zIndex(0)

        Row(){
          Button({ type: ButtonType.Circle, stateEffect: true }) {
            Stack() {
              Image($r("app.media.ic_public_delete_lids_filled"))
                .objectFit(ImageFit.Contain)
                .fillColor($r("sys.color.ohos_id_color_primary_contrary"))
                .width(Layout.ICON_SIZE)
                .height(Layout.ICON_SIZE)
                .rotate({
                  x: 0,
                  y: 0,
                  z: 1,
                  centerX: '89.45%',
                  centerY: '17.71%',
                  angle: this.rotateAngel
                })
              Image($r("app.media.ic_public_delete_body_filled"))
                .objectFit(ImageFit.Contain)
                .fillColor($r("sys.color.ohos_id_color_primary_contrary"))
                .width(Layout.ICON_SIZE)
                .height(Layout.ICON_SIZE)
                .rotate({
                  x: 0,
                  y: 0,
                  z: 1,
                  centerX: '82.94%',
                  centerY: '29.17%',
                  angle: -this.rotateAngel
                })
            }
            .width(Layout.ICON_SIZE)
            .height(Layout.ICON_SIZE)
          }
          .backgroundColor($r("app.color.button_background"))
          .zIndex(1)
          .onClick(() => this.deleteAnimation())
          .width(Layout.BUTTON_SIZE)
          .height(Layout.BUTTON_SIZE)
          .scale({
            x: this.deleteButtonScale,
            y: this.deleteButtonScale,
            z: 1,
            centerX: '50%',
            centerY: '50%'
          })
        }
        .opacity(this.bottomRightOpacity)
        .width(Layout.BUTTON_SIZE)
        .height(this.bottomHeight)
        .clip(false)
        .offset({ x: this.deleteLeftX - this.surfaceWidth - this.bottomLeftWidthMoving })
      }
      .width('100%')
      .offset({ x: this.overallX })
    }
    .width('100%')
    .onTouch( (touchEvent: TouchEvent) => {
      if (touchEvent.type == TouchType.Down) {
        if(this.registerEventCapture != null && this.registerEventCapture(this.swipeLayoutId)){
          // If the event is consumed by the parent component, the component does not proceed with subsequent logic.
          // If none of the parent components at the upper level consume it, the component consumes it.
          this.eventCaptureFlag = false;
          return;
        }
        if(this.surfaceWidth == -1){
          this.surfaceWidth = Number(touchEvent.target.area.width);
          this.initState();
        }
        this.responseSwipeEvent = false;
        this.angelCalFlag = false;    // Angle judgment flag bit
        this.startX = touchEvent.touches[0].screenX;
        this.startY = touchEvent.touches[0].screenY;
        this.lastTouchX = touchEvent.touches[0].screenX;
        if (!AppStorage.Has('swipelayout')) {
          // By adding Appstorage verification, you can prevent the parent component from sliding when the nesting is used because the prevent bubbling event fails.
          AppStorage.SetOrCreate('swipelayout', this.swipeLayoutId);
        }
      } else if (touchEvent.type == TouchType.Move) {
        if(this.eventCaptureFlag == false){
          return;
        }
        if (AppStorage.Get('swipelayout') != this.swipeLayoutId){
          return;
        }
        if(this.angelCalFlag == false){
          var hasChange = Math.abs(touchEvent.touches[0].screenX - this.startX) > 1e-3 ||
            Math.abs(touchEvent.touches[0].screenY - this.startY) > 1e-3
          if (hasChange) {
            this.responseSwipeEvent = (Math.abs(touchEvent.touches[0].screenX - this.startX) > Math.abs(touchEvent.touches[0].screenY - this.startY));
            this.angelCalFlag = true;
            FocusCallBack.setCallback(this.swipeLayoutId, this.loseFocusCallback.bind(this));
          }
        }
        if(this.responseSwipeEvent == false) {
          return;
        }
        touchEvent.stopPropagation();

        // Calculate the distance following your finger.
        let followHand = this.rateSurface * (touchEvent.touches[0].screenX - this.lastTouchX);
        this.surfaceX = this.surfaceX + followHand;
        this.bottomLeftX = this.bottomLeftX + followHand;

        if(this.bottomLeftX > this.rightThreshold){
          // 1. To the right of the right threshold, the underlying icon has not yet fully entered the screen
          this.rotateAngel = 0;
          this.deleteButtonScale = 1;
          this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidth;
        } else if (this.bottomLeftX > this.leftThreshold && this.bottomLeftX < this.rightThreshold) {
          // 2. Within the threshold on the left and the threshold on the right
          if(this.bottomLeftOpacity == 0){
            animateTo({
              duration: 200,
              curve: Curve.Friction,
              onFinish: () => {
              },
            }, () => {
              this.bottomLeftOpacity = 1;
              this.bottomLeftWidthMoving = (this.rightThreshold - this.bottomLeftX) * (1 - this.rateDelete) + this.bottomLeftWidth;
              this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidthMoving;
              this.rotateAngel = 12 - 12 * (this.bottomLeftX - this.leftThreshold)/(this.rightThreshold - this.leftThreshold);
              this.deleteButtonScale = 1.05 - 0.05 * (this.bottomLeftX - this.leftThreshold)/(this.rightThreshold - this.leftThreshold);
            })
          } else {
            this.bottomLeftWidthMoving = (this.rightThreshold - this.bottomLeftX) * (1 - this.rateDelete) + this.bottomLeftWidth;
            this.deleteLeftX = this.bottomLeftX + this.bottomLeftWidthMoving;
            this.rotateAngel = 12 - 12 * (this.bottomLeftX - this.leftThreshold)/(this.rightThreshold - this.leftThreshold);
            this.deleteButtonScale = 1.05 - 0.05 * (this.bottomLeftX - this.leftThreshold)/(this.rightThreshold - this.leftThreshold);
          }

        } else {
          // 3. Less than the leftmost threshold
          if (this.bottomLeftOpacity == 1){
            animateTo({
              duration: 200,
              curve: Curve.Friction,
              onFinish: () => {
              },
            }, () => {
              this.bottomLeftOpacity = 0;
              this.deleteLeftX = (this.bottomLeftX + this.surfaceWidth)/2 - this.deleteButtonScale * Layout.BUTTON_SIZE/2;
              this.rotateAngel = 17;
              this.deleteButtonScale = 1.2;
            })
          } else {
            this.deleteLeftX = (this.bottomLeftX + this.surfaceWidth)/2 - this.deleteButtonScale * Layout.BUTTON_SIZE/2;
          }
        }

        this.lastTouchX = touchEvent.touches[0].screenX;

      } else if (touchEvent.type == TouchType.Up) {
        this.eventCaptureFlag = true;
        AppStorage.Delete('swipelayout');
        if(this.responseSwipeEvent == false) {
          return;
        }
        if(this.bottomLeftX > this.rightThreshold){
          FocusCallBack.deleteCallback(this.swipeLayoutId)
          animateTo({
            duration: 200,
            curve: Curve.Friction,
            onFinish: () => {
            },
          }, () => {
            this.surfaceX = 0;
            this.bottomLeftX = 0 + this.surfaceWidth;
            this.deleteLeftX = 0 + this.surfaceWidth + this.bottomLeftWidth;
          })
        } else if (this.bottomLeftX > this.leftThreshold && this.bottomLeftX < this.rightThreshold) {
          animateTo({
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
          })
        } else  {
          this.deleteButtonCallback();
        }
      }
    })
  }
}