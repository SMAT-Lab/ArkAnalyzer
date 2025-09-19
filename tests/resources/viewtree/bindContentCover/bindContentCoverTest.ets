// xxx.ets
import { curves } from '@kit.ArkUI';


@Entry
@Component
struct bindContentCoverTest {
  @State @Watch('isShow1Change') isShow: boolean = false;
  @State @Watch('isShow2Change') isShow2: boolean = false;
  @State isScale1: number = 1;
  @State isScale2: number = 1;


  isShow1Change() {
    this.isShow ? this.isScale1 = 0.95 : this.isScale1 = 1;
  }


  isShow2Change() {
    this.isShow2 ? this.isScale2 = 0.95 : this.isScale2 = 1;
  }


  @Builder
  myBuilder2() {
    Column() {
      Button('close modal 2')
        .margin(10)
        .fontSize(20)
        .onClick(() => {
          this.isShow2 = false;
        })
    }
    .width('100%')
    .height('100%')
  }


  @Builder
  myBuilder() {
    Column() {
      Button('transition modal 2')
        .margin(10)
        .fontSize(20)
        .onClick(() => {
          this.isShow2 = true;
        }).bindContentCover(this.isShow2, this.myBuilder2(), {
        modalTransition: ModalTransition.NONE,
        backgroundColor: Color.Orange,
        onWillAppear: () => {
          console.log('BindContentCover onWillAppear.');
        },
        onAppear: () => {
          console.log('BindContentCover onAppear.');
        },
        onWillDisappear: () => {
          console.log('BindContentCover onWillDisappear.');
        },
        onDisappear: () => {
          console.log('BindContentCover onDisappear.');
        }
      })


      Button('close modal 1')
        .margin(10)
        .fontSize(20)
        .onClick(() => {
          this.isShow = false;
        })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .scale({ x: this.isScale2, y: this.isScale2 })
    .animation({ curve: curves.springMotion() })
  }


  build() {
    Column() {
      Button('transition modal 1')
        .onClick(() => {
          this.isShow = true;
        })
        .fontSize(20)
        .margin(10)
        .bindContentCover(this.isShow, this.myBuilder(), {
          modalTransition: ModalTransition.NONE,
          backgroundColor: Color.Pink,
          onWillAppear: () => {
            console.log('BindContentCover onWillAppear.');
          },
          onAppear: () => {
            console.log('BindContentCover onAppear.');
          },
          onWillDisappear: () => {
            console.log('BindContentCover onWillDisappear.');
          },
          onDisappear: () => {
            console.log('BindContentCover onDisappear.');
          }
        })
    }
    .justifyContent(FlexAlign.Center)
    .backgroundColor('#ff49c8ab')
    .width('100%')
    .height('100%')
    .scale({ x: this.isScale1, y: this.isScale1 })
    .animation({ curve: curves.springMotion() })

  }
}