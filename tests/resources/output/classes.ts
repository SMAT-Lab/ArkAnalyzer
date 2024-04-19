let sam: any;
let $temp1: any;
let $temp2: any;
let tom: [object Object];
let $temp3: any;
let $temp4: any;
let $temp5: any;
let dad: any;
let $temp6: any;
let $temp7: any;
let passcode: any;
let $temp8: any;
let grid1: any;
let $temp9: any;
let $temp10: any;
let grid2: any;
let $temp11: any;
let $temp12: any;
let $temp13: any;
let $temp14: any;
let $temp15: any;
let $temp16: any;
let department: any;
let $temp17: any;
let point3d: [object Object];
let $temp18: any;
let numberRegexp: any;
let $temp19: any;

$temp2 = "Sammy the Python";
$temp1 = new Snake($temp2);
sam = $temp1;
$temp4 = "Tommy the Palomino";
$temp3 = new Horse($temp4);
tom = $temp3;
sam.move();
$temp5 = 34;
tom.move($temp5);
$temp7 = "Man with the 8 strong legs";
$temp6 = new Octopus($temp7);
dad = $temp6;
$temp8 = "secret passcode";
passcode = $temp8;
$temp10 = 1.0;
$temp9 = new Grid($temp10);
grid1 = $temp9;
$temp12 = 5.0;
$temp11 = new Grid($temp12);
grid2 = $temp11;
$temp13 = new AnonymousClass$_DEFAULT_ARK_METHOD$0();
$temp14 = grid1.calculateDistanceFromOrigin($temp13);
logger.info($temp14);
$temp15 = new AnonymousClass$_DEFAULT_ARK_METHOD$1();
$temp16 = grid2.calculateDistanceFromOrigin($temp15);
logger.info($temp16);
department = undefined;
$temp17 = new AccountingDepartment();
department = $temp17;
department.printName();
department.printMeeting();
$temp18 = new AnonymousClass$_DEFAULT_ARK_METHOD$2();
point3d = $temp18;
$temp19 = /^[0-9]+$/;
numberRegexp = $temp19;

export {ZipCodeValidator};
export {ZipCodeValidator as mainValidator};
class Animal{
  protected _name:string | undefined;
  name:string | undefined;
  public constructor(theName: string){
    
    
    this._name = theName;
    
  }
  public move(distanceInMeters: number){
    let $temp2: any;
    let $temp3: any;
    let $temp4: any;
    let $temp5: any;
    
    
    $temp2 = this._name + ' moved ';
    $temp3 = distanceInMeters + 'm.';
    $temp4 = '' + $temp2;
    $temp5 = $temp4 + $temp3;
    logger.info($temp5);
    
  }
  get name(): string | undefined {
    let $temp1: any;
    
    $temp1 = this._name;
    return $temp1;
  }
  set name(newName: string|undefined){
    
    
    this._name = newName;
    
  }
  public print(a: any): number | null {
    let $temp2: any;
    
    
    $temp2 = 0;
    return $temp2;
  }
  public testArrayReturn(){
    let $temp1: (any)[];
    
    $temp1 = new Array<any>(0);
    return $temp1;
  }
}
class Snake extends Animal {
  constructor(name: string){
    
    
    super(name);
    
  }
  move(distanceInMeters: any){
    let $temp2: any;
    
    
    $temp2 = "Slithering...";
    logger.info($temp2);
    super.move(distanceInMeters);
    
  }
}
class Horse extends Animal {
  constructor(name: string){
    
    
    super(name);
    
  }
  move(distanceInMeters: any){
    let $temp2: any;
    
    
    $temp2 = "Galloping...";
    logger.info($temp2);
    super.move(distanceInMeters);
    
  }
}
class Octopus{
  readonly name:string;
  readonly numberOfLegs:number;
  constructor(theName: string){
    
    
    this.name = theName;
    
  }
}
class Grid{
  static origin;
  calculateDistanceFromOrigin(point: {x:number,y:number}){
    let xDist: any;
    let $temp2: any;
    let $temp3: any;
    let $temp4: any;
    let $temp5: any;
    let yDist: any;
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
    
    
    $temp2 = Grid.origin;
    $temp3 = point.x;
    $temp4 = $temp2.x;
    $temp5 = $temp3 - $temp4;
    xDist = $temp5;
    $temp6 = Grid.origin;
    $temp7 = point.y;
    $temp8 = $temp6.y;
    $temp9 = $temp7 - $temp8;
    yDist = $temp9;
    $temp10 = xDist * xDist;
    $temp11 = yDist * yDist;
    $temp12 = $temp10 + $temp11;
    $temp13 = Math.sqrt($temp12);
    $temp14 = this.scale;
    $temp15 = $temp13 / $temp14;
    return $temp15;
  }
  constructor(scale: number){
    
    
    
  }
}
class AnonymousClass$_DEFAULT_ARK_METHOD$0{
}
class AnonymousClass$_DEFAULT_ARK_METHOD$1{
}
abstract class Department{
  constructor(name: string){
    
    
    
  }
  printName(): void {
    let $temp1: any;
    let $temp2: any;
    let $temp3: any;
    
    $temp1 = 'Department name: ';
    $temp2 = this.name;
    $temp3 = $temp1 + $temp2;
    logger.info($temp3);
    
  }
  abstract printMeeting(): void ;
}
class AccountingDepartment extends Department {
  constructor(){
    let $temp1: any;
    
    $temp1 = 'Accounting and Auditing';
    super($temp1);
    
  }
  printMeeting(): void {
    let $temp1: any;
    
    $temp1 = 'The Accounting Department meets each Monday at 10am.';
    logger.info($temp1);
    
  }
  generateReports(): void {
    let $temp1: any;
    
    $temp1 = 'Generating accounting reports...';
    logger.info($temp1);
    
  }
}
class Point{
  x:number;
  y:number;
}
interface Point3d extends Point {
  z:number;
}
class AnonymousClass$_DEFAULT_ARK_METHOD$2{
}
export interface StringValidator{
  isAcceptable(s?: string): boolean ;
}
export default class ZipCodeValidator implements StringValidator{
  isAcceptable(s?: string){
    let $temp2: any;
    let $temp3: any;
    let $temp4: any;
    let $temp5: any;
    let $temp6: any;
    
    
    $temp2 = 5;
    $temp3 = s.length;
    $temp4 = $temp3 === $temp2;
    $temp5 = numberRegexp.test(s);
    $temp6 = $temp4 && $temp5;
    return $temp6;
  }
}
export class ParseIntBasedZipCodeValidator{
  isAcceptable(s: string){
    let $temp2: any;
    let $temp3: any;
    let $temp4: any;
    let $temp5: any;
    let $temp6: any;
    let $temp7: any;
    let $temp8: any;
    
    
    $temp2 = 5;
    $temp3 = s.length;
    $temp4 = parseInt(s);
    $temp5 = $temp4.toString();
    $temp6 = $temp3 === $temp2;
    $temp7 = $temp5 === s;
    $temp8 = $temp6 && $temp7;
    return $temp8;
  }
}
