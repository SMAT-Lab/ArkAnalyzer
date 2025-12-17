import { Theme } from ''@ohos.arkui.theme';
import { TestInterface } from '../util/test2';
import { hilog } from '@kit.PerformanceAnalysisKit';
export * from '../util/test2';

@Preview
@Component
export struct MyComponent {
  private status1?: string;
  private status2?: string;
  private callback?:()=>void;
  private interfaceField?:TestInterface;

  constructor(status1: string) {
    super();
    this.status1 = status1;
  }

  build() {
    Column() {
      Row() {
        Text(this.status1)
          .id('HelloWorld1')
          .fontSize(50)
          .fontWeight(FontWeight.Bold);
      }.height(100)
      .onClick(()=>{
        this.callback!();
        this.interfaceField?.callf('');
        hilog.debug(11,'aa','message');
      })
    }
  }
}

export function f(s:string) {
  console.log('xxx');
}
