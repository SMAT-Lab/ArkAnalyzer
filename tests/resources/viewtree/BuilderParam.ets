namespace Case1 {
  @Component
  struct Child {
    @Builder customBuilder() { }
    // 使用父组件@Builder装饰的方法初始化子组件@BuilderParam
    @BuilderParam customBuilderParam: () => void = this.customBuilder;

    build() {
      Column() {
        this.customBuilderParam()
      }
    }
  }

  @Entry
  @Component
  struct Parent {
    @Builder componentBuilder() {
      Text(`Parent builder `)
    }

    build() {
      Column() {
        Child({ customBuilderParam: this.componentBuilder })
      }
    }
  }
}

namespace Case2 {
  @Component
  struct Child {
    label: string = `Child`
    @Builder customBuilder() { }
    @Builder customChangeThisBuilder() { }
    @BuilderParam customBuilderParam: () => void = this.customBuilder;
    @BuilderParam customChangeThisBuilderParam: () => void = this.customChangeThisBuilder;

    build() {
      Column() {
        this.customBuilderParam()
        this.customChangeThisBuilderParam()
      }
    }
  }

  @Entry
  @Component
  struct Parent {
    label: string = `Parent`

    @Builder componentBuilder() {
      Text(`${this.label}`)
    }

    build() {
      Column() {
        this.componentBuilder()
        Child({ customBuilderParam: this.componentBuilder, customChangeThisBuilderParam: (): void => { this.componentBuilder() } })
      }
    }
  }
}

namespace Case3 {
  class Tmp {
    label: string = ''
  }
  @Builder function overBuilder($$: Tmp) {
    Text($$.label)
      .width(400)
      .height(50)
      .backgroundColor(Color.Green)
  }

  @Component
  struct Child {
    label: string = 'Child'
    @Builder customBuilder() { }
    // 无参数类型，指向的componentBuilder也是无参数类型
    @BuilderParam customBuilderParam: () => void = this.customBuilder;
    // 有参数类型，指向的overBuilder也是有参数类型的方法
    @BuilderParam customOverBuilderParam: ($$: Tmp) => void = overBuilder;

    build() {
      Column() {
        this.customBuilderParam()
        this.customOverBuilderParam({ label: 'global Builder label' })
      }
    }
  }

  @Entry
  @Component
  struct Parent {
    label: string = 'Parent'

    @Builder componentBuilder() {
      Text(`${this.label}`)
    }

    build() {
      Column() {
        this.componentBuilder()
        Child({ customBuilderParam: this.componentBuilder, customOverBuilderParam: overBuilder })
      }
    }
  }
}


@Component
struct CustomContainer {
  @Prop header: string = '';
  @Builder closerBuilder(){ }
  // 使用父组件的尾随闭包{}(@Builder装饰的方法)初始化子组件@BuilderParam
  @BuilderParam closer: () => void = this.closerBuilder

  build() {
    Column() {
      Text(this.header)
        .fontSize(30)
      this.closer()
    }
  }
}

@Builder function specificParam(label1: string, label2: string) {
  Column() {
    Text(label1)
      .fontSize(30)
    Text(label2)
      .fontSize(30)
  }
}

@Entry
@Component
struct CustomContainerUser {
  @State text: string = 'header';

  build() {
    Column() {
      // 创建CustomContainer，在创建CustomContainer时，通过其后紧跟一个大括号“{}”形成尾随闭包
      // 作为传递给子组件CustomContainer @BuilderParam closer: () => void的参数
      CustomContainer({ header: this.text }) {
        Column() {
          specificParam('testA', 'testB')
        }.backgroundColor(Color.Yellow)
          .onClick(() => {
            this.text = 'changeHeader';
          })
      }
    }
  }
}
