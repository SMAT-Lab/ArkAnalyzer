let $temp1: any;
let $temp2: any;
let c: [object Object];
let $temp3: any;
let a2: any;
let nameOfA: any;
let directions: (any)[];
let $temp4: (any)[];

$temp1 = "Princess Caroline";
$temp2 = Response1.Yes;
respond($temp1,$temp2);
$temp3 = new AnonymousClass$_DEFAULT_ARK_METHOD$0();
c = $temp3;
f(E);
a2 = Enum.A;
nameOfA = Enum.a2;
$temp4 = new Array<any>(4);
$temp4[0] = Directions.Up;
$temp4[1] = Directions.Down;
$temp4[2] = Directions.Left;
$temp4[3] = Directions.Right;
directions = $temp4;

enum Direction1{
  Up,
  Down,
  Left,
  Right,
}
enum Direction2{
  Up,
  Down,
  Left,
  Right,
}
enum BooleanLikeHeterogeneousEnum{
  No,
  Yes,
}
enum E1{
  X,
  Y,
  Z,
}
enum E2{
  A,
  B,
  C,
}
enum FileAccess{
  None,
  Read,
  Write,
  ReadWrite,
  G,
}
enum Response1{
  No,
  Yes,
}
function respond(recipient: string,message: Response1): void {
  
  
  
  
}
enum ShapeKind{
  Circle,
  Square,
}
interface Circle{
  kind:ShapeKind.Circle;
  radius:number;
}
interface Square{
  kind:ShapeKind.Square;
  sideLength:number;
}
class AnonymousClass$_DEFAULT_ARK_METHOD$0{
}
enum E{
  X,
  Y,
  Z,
}
function f(obj: {X:number}){
  let $temp2: any;
  
  
  $temp2 = obj.X;
  return $temp2;
}
declare enum Enum{
  A,
}
const enum Directions{
  Up,
  Down,
  Left,
  Right,
}
