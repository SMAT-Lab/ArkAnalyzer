// 定义在全局的@Styles封装的样式
@Styles
function globalFancy1() {
  .width(150)
  .height(100)
  .backgroundColor(Color.Pink)
}

@Styles
function fancy() {
    .width(300)
}

@Entry
@Component
struct GlobalFancy {
  @State heightValue: number = 100;

  // 定义在组件内的@Styles封装的样式
  @Styles
  fancy() {
    .width(200)
    .height(this.heightValue)
    .backgroundColor(Color.Gray)
    .onClick(() => {
      this.heightValue = 200;
    })
  }

  build() {
    Column({ space: 10 }) {
      // 使用全局的@Styles封装的样式
      Text('FancyA')
        .globalFancy1()
        .fontSize(30)
      // 使用组件内的@Styles封装的样式
      Text('FancyB')
        .fancy()
        .fontSize(30)
    }
    .width('100%')
  }
}


@Extend(Text)
function makeMeClick(onClick: () => void) {
  .backgroundColor(Color.Blue)
  .onClick(onClick)
}

@Entry
@Component
struct FancyUse {
  @State label: string = 'Hello World';

  onClickHandler() {
    this.label = 'Hello ArkUI';
  }

  build() {
    Row({ space: 10 }) {
      Text(`${this.label}`)
        .makeMeClick(() => {
          this.onClickHandler();
        })
        .fancy()
    }
  }
}

@AnimatableExtend(Text)
function animatableWidth(width: number) {
  .width(width)
}

@Entry
@Component
struct AnimatablePropertyText {
  @State textWidth: number = 80;

  build() {
    Column() {
      Text('AnimatableProperty')
        .animatableWidth(this.textWidth)
        .animation({ duration: 2000, curve: Curve.Ease })
    }.width('100%')
    .padding(10)
  }
}