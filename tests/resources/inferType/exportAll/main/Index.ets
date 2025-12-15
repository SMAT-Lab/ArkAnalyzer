import { TestInterface } from '../util/test2';
import { MyComponent,Ineterface2} from './MyComponent';

export class TestInterface2 implements TestInterface{
  callf(s: string): string {
    return '';
  }
}
export class TestInterface3 implements TestInterface{
  callf(s: string): string {
    return '';
  }
}

@Preview
@Entry
@Component
struct Index {
  @State message: string = 'Hello World';

  build() {
    Column() {
      MyComponent({
        status1:'aaa',
        status2:'bbb',
        interfaceField:new TestInterface2()
      })
      MyComponent({
        status1:'aaa',
        status2:'bbb',
        callback:()=>{
          console.log(this.message);
          let a=new Ineterface2();
        },
        interfaceField:new TestInterface3()
      })
    }
    .height('100%')
    .width('100%')
  }
}