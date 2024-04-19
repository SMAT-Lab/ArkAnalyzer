let myIdentity: any;
let output: any;
let $temp1: any;
let l: any;
let $temp2: any;
let $temp3: any;

myIdentity = identity;
$temp1 = "myString";
output = identity($temp1);
$temp2 = new Lion();
l = $temp2;
$temp3 = l.keeper;
logger.info($temp3);

function identity<any>(arg: T): T {
  
  
  return arg;
}
class GenericNumber<any>{
  zeroValue:T;
  add:any;
  private methods:Set;
  private calls:Map;
}
interface Lengthwise{
  length:number;
}
function loggingIdentity<any>(arg: T): T {
  let $temp2: any;
  
  
  $temp2 = arg.length;
  logger.info($temp2);
  return arg;
}
class BeeKeeper{
  hasMask:boolean;
}
class ZooKeeper{
  nametag:string;
}
class Animal1{
  numLegs:number;
}
class Bee extends Animal1 {
  keeper:BeeKeeper;
}
class Lion extends Animal1 {
  keeper:ZooKeeper;
}
function createInstance<any>(c: any): A {
  let $temp2: any;
  
  
  $temp2 = new c();
  return $temp2;
}
