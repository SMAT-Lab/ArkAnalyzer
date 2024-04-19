let __generate__Id: number;
let $temp1: number;
let $temp2: ParentComponent;
let $temp3: string;
let $temp4: AnonymousClass$_DEFAULT_ARK_METHOD$0;
let $temp5: Test;
let $temp6: string;
let $temp7: AnonymousClass$_DEFAULT_ARK_METHOD$1;

$temp1 = 0;
__generate__Id = $temp1;
$temp3 = "1";
$temp4 = new AnonymousClass$_DEFAULT_ARK_METHOD$0();
$temp2 = new ParentComponent($temp3,undefined,$temp4);
loadDocument($temp2);
$temp6 = "1";
$temp7 = new AnonymousClass$_DEFAULT_ARK_METHOD$1();
$temp5 = new Test($temp6,undefined,$temp7);
loadDocument($temp5);

interface CountDownComponent_Params{
  count?:number;
  costOfOneAttempt?:number;
}
interface ParentComponent_Params{
  countDownStartValue?:number;
}
function generateId(): string {
  let $temp1: string;
  let __generate__Id: any;
  let $temp2: string;
  
  $temp1 = "propSimpleModel_";
  __generate__Id = __generate__Id + 1;
  $temp2 = $temp1 + __generate__Id;
  return $temp2;
}
class ParentComponent extends View {
  private __countDownStartValue:ObservedPropertySimple;
  countDownStartValue:any;
  constructor(compilerAssignedUniqueChildId: any,parent: any,params: any,localStorage: any){
    let $temp5: ObservedPropertySimple;
    let $temp6: number;
    let $temp7: string;
    
    
    
    
    
    super(compilerAssignedUniqueChildId,parent,localStorage);
    $temp6 = 10;
    $temp7 = "countDownStartValue";
    $temp5 = new ObservedPropertySimple($temp6,this,$temp7);
    this.__countDownStartValue = $temp5;
    this.updateWithValueParams(params);
    
  }
  updateWithValueParams(params: ParentComponent_Params){
    let $temp2: number;
    let $temp3: number;
    
    
    $temp2 = params.countDownStartValue;
    if ($temp2 === undefined) {
    } else {
      $temp3 = params.countDownStartValue;
      this.countDownStartValue = $temp3;
    }
    
  }
  aboutToBeDeleted(){
    let $temp1: ObservedPropertySimple;
    let $temp2: any;
    let $temp3: any;
    
    $temp1 = this.__countDownStartValue;
    $temp1.aboutToBeDeleted();
    $temp2 = this.id();
    $temp3 = SubscriberManager.Get();
    $temp3.delete($temp2);
    
  }
  get countDownStartValue(){
    let $temp1: ObservedPropertySimple;
    let $temp2: any;
    
    $temp1 = this.__countDownStartValue;
    $temp2 = $temp1.get();
    return $temp2;
  }
  set countDownStartValue(newValue: number){
    let $temp2: ObservedPropertySimple;
    
    
    $temp2 = this.__countDownStartValue;
    $temp2.set(newValue);
    
  }
  render(){
    let $temp1: any;
    let $temp2: string;
    let $temp3: string;
    let $temp4: string;
    let earlierCreatedChild_2: CountDownComponent;
    let $temp5: any;
    let $temp6: boolean;
    let $temp7: any;
    let $temp8: string;
    let $temp9: CountDownComponent;
    let $temp10: string;
    let $temp11: AnonymousClass$render$0;
    let $temp12: AnonymousClass$render$1;
    
    Column.create();
    $temp1 = this.countDownStartValue;
    $temp2 = 'Grant ' + $temp1;
    Text.create($temp2);
    Text.pop();
    Button.createWithChild();
    Button.onClick(AnonymousFunc$render$0);
    $temp3 = "+1 - Nuggets in New Game";
    Text.create($temp3);
    Text.pop();
    Button.pop();
    Button.createWithChild();
    Button.onClick(AnonymousFunc$render$1);
    $temp4 = "-1  - Nuggets in New Game";
    Text.create($temp4);
    Text.pop();
    Button.pop();
    $temp5 = this.findChildById;
    $temp6 = this && $temp5;
    if ($temp6 == 0) {
      $temp12 = new AnonymousClass$render$1();
      earlierCreatedChild_2.updateWithValueParams($temp12);
      View.create(earlierCreatedChild_2);
    } else {
      $temp10 = "2";
      $temp11 = new AnonymousClass$render$0();
      $temp9 = new CountDownComponent($temp10,this,$temp11);
      View.create($temp9);
    }
    $temp8 = "2";
    $temp7 = <unknown>instanceinvoke this.<@_UnkownProjectName/_UnkownFileName: .findChildById()>($temp8);
    $temp7 = undefined;
    earlierCreatedChild_2 = $temp7;
    if (earlierCreatedChild_2 != undefined) {
    }
    Column.pop();
    
  }
  AnonymousFunc$render$0(){
    let $temp1: number;
    
    $temp1 = 1;
    this.countDownStartValue = this.countDownStartValue + $temp1;
    
  }
  AnonymousFunc$render$1(){
    let $temp1: number;
    
    $temp1 = 1;
    this.countDownStartValue = this.countDownStartValue - $temp1;
    
  }
}
class AnonymousClass$render$0{
}
class AnonymousClass$render$1{
}
class CountDownComponent extends View {
  private __count:SynchedPropertySimpleOneWay;
  count:any;
  private costOfOneAttempt?:number;
  constructor(compilerAssignedUniqueChildId: any,parent: any,params: any,localStorage: any){
    let $temp5: SynchedPropertySimpleOneWay;
    let $temp6: string;
    
    
    
    
    
    super(compilerAssignedUniqueChildId,parent,localStorage);
    $temp6 = "count";
    $temp5 = new SynchedPropertySimpleOneWay(params.<@_UnkownProjectName/_UnkownFileName: .count>,this,$temp6);
    this.__count = $temp5;
    this.costOfOneAttempt = undefined;
    this.updateWithValueParams(params);
    
  }
  updateWithValueParams(params: CountDownComponent_Params){
    let $temp2: number;
    let $temp3: number;
    let $temp4: number;
    
    
    $temp2 = params.count;
    this.count = $temp2;
    $temp3 = params.costOfOneAttempt;
    if ($temp3 === undefined) {
    } else {
      $temp4 = params.costOfOneAttempt;
      this.costOfOneAttempt = $temp4;
    }
    
  }
  aboutToBeDeleted(){
    let $temp1: SynchedPropertySimpleOneWay;
    let $temp2: any;
    let $temp3: any;
    
    $temp1 = this.__count;
    $temp1.aboutToBeDeleted();
    $temp2 = this.id();
    $temp3 = SubscriberManager.Get();
    $temp3.delete($temp2);
    
  }
  get count(){
    let $temp1: SynchedPropertySimpleOneWay;
    let $temp2: any;
    
    $temp1 = this.__count;
    $temp2 = $temp1.get();
    return $temp2;
  }
  set count(newValue: number){
    let $temp2: SynchedPropertySimpleOneWay;
    
    
    $temp2 = this.__count;
    $temp2.set(newValue);
    
  }
  render(){
    let $temp1: number;
    let $temp2: any;
    let $temp3: number;
    let $temp4: any;
    let $temp5: string;
    let $temp6: number;
    let $temp7: string;
    let $temp8: string;
    
    Column.create();
    If.create();
    $temp1 = 0;
    $temp2 = this.count;
    if ($temp2 <= $temp1) {
      $temp6 = 1;
      If.branchId($temp6);
      $temp7 = "Game over!";
      Text.create($temp7);
      Text.pop();
    } else {
      $temp3 = 0;
      If.branchId($temp3);
      $temp4 = this.count;
      $temp5 = 'You have ' + $temp4;
      Text.create($temp5);
      Text.pop();
    }
    If.pop();
    Button.createWithChild();
    Button.onClick(AnonymousFunc$render$0);
    $temp8 = "Try again";
    Text.create($temp8);
    Text.pop();
    Button.pop();
    Column.pop();
    
  }
  AnonymousFunc$render$0(){
    let $temp1: number;
    
    $temp1 = this.costOfOneAttempt;
    this.count = this.count - $temp1;
    
  }
}
class AnonymousClass$_DEFAULT_ARK_METHOD$0{
}
class Test extends View {
  private data:MyDataSource;
  constructor(compilerAssignedUniqueChildId: any,parent: any,params: any,localStorage: any){
    let $temp5: MyDataSource;
    
    
    
    
    
    super(compilerAssignedUniqueChildId,parent,localStorage);
    $temp5 = new MyDataSource();
    this.data = $temp5;
    this.updateWithValueParams(params);
    
  }
  updateWithValueParams(params: Test_Params){
    let $temp2: any;
    let $temp3: any;
    
    
    $temp2 = params.data;
    if ($temp2 === undefined) {
    } else {
      $temp3 = params.data;
      this.data = $temp3;
    }
    
  }
  aboutToBeDeleted(){
    let $temp1: any;
    let $temp2: any;
    
    $temp1 = this.id();
    $temp2 = SubscriberManager.Get();
    $temp2.delete($temp1);
    
  }
  render(){
    let $temp1: string;
    let $temp2: MyDataSource;
    let $temp3: any;
    
    Grid.create();
    $temp1 = "4";
    $temp2 = this.data;
    $temp3 = ObservedObject.GetRawObject($temp2);
    LazyForEach.create($temp1,this,$temp3,AnonymousFunc$render$0,AnonymousFunc$render$1);
    LazyForEach.pop();
    Grid.pop();
    
  }
  AnonymousFunc$render$0(row: any){
    let $temp2: boolean;
    let $temp3: boolean;
    
    
    $temp2 = true;
    this.isRenderingInProgress = $temp2;
    GridItem.create();
    Text.create(row);
    Text.pop();
    GridItem.pop();
    $temp3 = false;
    this.isRenderingInProgress = $temp3;
    
  }
  AnonymousFunc$render$1(row: any){
    
    
    
  }
}
class AnonymousClass$_DEFAULT_ARK_METHOD$1{
}
