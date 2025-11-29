
@Preview
@Component
export struct MyComponent {
  private status1?: string;
  private status2?: string;
  private callback?:()=>void;

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
          .fontWeight(FontWeight.Bold)
      }.height(100)
      .onClick(()=>{
        this.callback!();
        this.interfaceField?.callf('');
      });
    }
  }
}

export function f(s:string){
  console.log('xxx');
}