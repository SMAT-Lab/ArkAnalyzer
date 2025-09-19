@Entry
@Component
struct BindSheetDemo {
  // 半模态转场显示隐藏控制
  @State isShowSheet: boolean = false;
  private menuList: string[] = ['不要辣', '少放辣', '多放辣', '不要香菜', '不要香葱', '不要一次性餐具', '需要一次性餐具'];


  // 通过@Builder构建半模态展示界面
  @Builder
  mySheet() {
    Column() {
      Flex({ direction: FlexDirection.Row, wrap: FlexWrap.Wrap }) {
        ForEach(this.menuList, (item: string) => {
          Text(item)
            .fontSize(16)
            .fontColor(0x333333)
            .backgroundColor(0xf1f1f1)
            .borderRadius(8)
            .margin(10)
            .padding(10)
        })
      }
      .padding({ top: 18 })
    }
    .width('100%')
    .height('100%')
    .backgroundColor(Color.White)
  }


  build() {
    Column() {
      Text('口味与餐具')
        .fontSize(28)
        .padding({ top: 30, bottom: 30 })
      Column() {
        Row() {
          Row()
            .width(10)
            .height(10)
            .backgroundColor('#a8a8a8')
            .margin({ right: 12 })
            .borderRadius(20)


          Column() {
            Text('选择点餐口味和餐具')
              .fontSize(16)
              .fontWeight(FontWeight.Medium)
          }
          .alignItems(HorizontalAlign.Start)


          Blank()


          Row()
            .width(12)
            .height(12)
            .margin({ right: 15 })
            .border({
              width: { top: 2, right: 2 },
              color: 0xcccccc
            })
            .rotate({ angle: 45 })
        }
        .borderRadius(15)
        .shadow({ radius: 100, color: '#ededed' })
        .width('90%')
        .alignItems(VerticalAlign.Center)
        .padding({ left: 15, top: 15, bottom: 15 })
        .backgroundColor(Color.White)
        .bindSheet(this.isShowSheet, this.mySheet(), {
          height: 300,
          dragBar: false,
          onDisappear: () => {
            this.isShowSheet = !this.isShowSheet;
          }
        })
        .onClick(() => {
          this.isShowSheet = !this.isShowSheet;
        })
      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
    .backgroundColor(0xf1f1f1)
  }
}