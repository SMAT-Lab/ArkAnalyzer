import * as XX from './MyComponent';
import {f,MyComponent} from './MyComponent';
@Component
struct MyComponent2{
  build() {
    Row(){
      XX.MyComponent({
        status1:'aaa',
        status2:'bbb',
        callback:()=>{
          console.log('cccc');
          XX.f('hello');
          f('hello2');
        }
      });
      MyComponent({
        status1:'xxxx';
      });
    }
  }
}