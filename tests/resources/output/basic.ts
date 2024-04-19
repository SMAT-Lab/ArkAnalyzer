let someClass: ;
let m: any;
let $temp1: any;
let $temp2: any;
let x: number;
let $temp3: any;
let soo: any;
let $temp4: any;

someClass = ;
$temp2 = "Hello, world";
$temp1 = new someClass($temp2);
m = $temp1;
$temp3 = 1;
x = $temp3;
$temp4 = 123;
soo = $temp4;
forLoopTest();
test();

export {ExtendedAdder as ExtAdder};
export {ExtendedAdder};
function forLoopTest(){
  let myPerson: any;
  let $temp1: any;
  let $temp2: any;
  let i: any;
  let $temp3: any;
  let $temp4: any;
  let newAge: any;
  let $temp5: any;
  
  $temp2 = 10;
  $temp1 = new Person($temp2);
  myPerson = $temp1;
  $temp3 = 0;
  i = $temp3;
  $temp4 = 10;
  for (; i < $temp4; i = i + 1) {
    $temp5 = myPerson.age;
    newAge = $temp5 + i;
    logger.info(newAge);
  }
  
}
function test(){
  let sampleData: (number)[];
  let $temp1: (number)[];
  let i: any;
  let $temp2: any;
  let $temp3: any;
  let $temp4: any;
  let $temp5: any;
  let $temp6: any;
  let $temp7: any;
  let $temp8: any;
  let $temp9: any;
  let $temp10: any;
  let $temp11: any;
  let $temp12: any;
  let $temp13: any;
  let $temp14: any;
  let $temp15: any;
  let $temp16: any;
  let $temp17: any;
  let $temp18: any;
  let $temp19: any;
  let $temp20: any;
  let $temp21: any;
  let $temp22: any;
  let $temp23: any;
  let $temp24: any;
  let count: any;
  let $temp25: any;
  let $temp26: any;
  let $temp27: any;
  let j: any;
  let $temp28: any;
  let $temp29: any;
  let $temp30: any;
  let $temp31: any;
  let k: any;
  let $temp32: any;
  let $temp33: any;
  let $temp34: any;
  let $temp35: any;
  let $temp36: any;
  let $temp37: any;
  
  $temp1 = new Array<number>(5);
  $temp1[0] = 1;
  $temp1[1] = 2;
  $temp1[2] = 3;
  $temp1[3] = 4;
  $temp1[4] = 5;
  sampleData = $temp1;
  $temp2 = 0;
  i = $temp2;
  $temp3 = sampleData.length;
  for (; i < $temp3; i = i + 1) {
    $temp4 = 2;
    $temp5 = sampleData[i];
    $temp6 = 0;
    $temp7 = $temp5 % $temp4;
    if ($temp7 !== $temp6) {
      $temp10 = sampleData[i] + ' 是奇数';
      $temp11 = '' + $temp10;
      logger.info($temp11);
    } else {
      $temp8 = sampleData[i] + ' 是偶数';
      $temp9 = '' + $temp8;
      logger.info($temp9);
    }
    $temp12 = 3;
    $temp13 = sampleData[i];
    $temp14 = $temp13 % $temp12;
    $temp15 = 0;
    $temp16 = 1;
    $temp17 = 2;
    switch ($temp14) {
      case $temp15:
        $temp18 = sampleData[i] + ' 可被 3 整除';
        $temp19 = '' + $temp18;
        logger.info($temp19);
          break;
      case $temp16:
        $temp20 = sampleData[i] + ' 除以 3 余 1';
        $temp21 = '' + $temp20;
        logger.info($temp21);
          break;
      case $temp17:
        $temp22 = sampleData[i] + ' 除以 3 余 2';
        $temp23 = '' + $temp22;
        logger.info($temp23);
          break;
      default: 
        $temp24 = "无法判断";
        logger.info($temp24);
      
    }
    $temp25 = 0;
    count = $temp25;
    $temp26 = sampleData[i];
    while (count < $temp26) {
      $temp27 = '当前计数: ' + count;
      logger.info($temp27);
      count = count + 1;
    }
    $temp28 = 0;
    j = $temp28;
    $temp29 = 5;
    for (; j < $temp29; j = j + 1) {
      $temp30 = 2;
      if (j !== $temp30) {
        $temp31 = '当前内层循环计数: ' + j;
        logger.info($temp31);
      } else {
        continue;
      }
    }
    $temp32 = 0;
    k = $temp32;
    $temp33 = 3;
    for (; k < $temp33; k = k + 1) {
      $temp34 = '外层循环计数: ' + k;
      logger.info($temp34);
      $temp35 = 'Department name: ';
      $temp36 = $temp35 + k;
      logger.info($temp36);
      $temp37 = 1;
      if (k !== $temp37) {
      } else {
        break;
      }
    }
  }
  
}
class Person{
  x:number;
  growOld;
  constructor(age: number){
    
    
    
  }
  public getAge(){
    let $temp1: any;
    
    $temp1 = this.age;
    return $temp1;
  }
  static wooooof(){
    let $temp1: any;
    
    $temp1 = "not a person sound";
    logger.info($temp1);
    
  }
}
export function classMethodTest(){
  let notPerson: any;
  let $temp1: any;
  let $temp2: any;
  let x: any;
  let $temp3: any;
  let z: any;
  let $temp4: any;
  let y: any;
  let a: any;
  
  $temp2 = 10;
  $temp1 = new Person($temp2);
  notPerson = $temp1;
  $temp3 = new Map();
  x = $temp3;
  $temp4 = new Error();
  z = $temp4;
  y = test();
  a = notPerson.age;
  notPerson.growOld();
  Person.wooooof();
  
}
interface Alarm{
  alert(): void ;
}
interface Alarm2{
  alert2(): void ;
}
class Door{
}
export function foo(x: number): number {
  let y: any;
  let $temp2: any;
  let k: any;
  let $temp3: any;
  
  
  $temp2 = 0;
  y = $temp2;
  $temp3 = 0;
  k = $temp3;
  for (; k < x; k = k + 1) {
    y = y + k;
  }
  return y;
}
class Adder{
  add;
  constructor(a: number){
    
    
    
  }
}
class ExtendedAdder extends Adder {
  private superAdd;
  add;
}
export function listParameters(u: number,v: number,w: string): {x:number,y:number,z:string} {
  let $temp4: any;
  
  
  
  
  $temp4 = new AnonymousClass$listParameters$0();
  return $temp4;
}
class AnonymousClass$listParameters$0{
}
export class SecurityDoor extends Door  implements Alarm,Alarm2{
  x:number;
  y:string;
  public Members;
  alert(): void {
    let $temp1: any;
    
    $temp1 = "SecurityDoor alert";
    logger.info($temp1);
    
  }
  alert2(): void {
    let $temp1: any;
    
    $temp1 = "SecurityDoor alert2";
    logger.info($temp1);
    
  }
  public fooo(){
    let $temp1: any;
    
    $temp1 = "This is fooo!";
    logger.info($temp1);
    
  }
  constructor(x: number,y: string){
    let $temp3: any;
    
    
    
    super();
    this.x = x;
    this.y = y;
    $temp3 = "This is a constrctor!";
    logger.info($temp3);
    
  }
}
class <any>{
  content:Type;
  constructor(value: Type){
    
    
    this.content = value;
    
  }
}
abstract class Animal{
  public name;
  public constructor(name: string){
    
    
    this.name = name;
    
  }
  public abstract sayHi(): void ;
}
export interface StringValidator{
  color?:string;
  width?:number;
  isAcceptable(s?: string): boolean ;
}
