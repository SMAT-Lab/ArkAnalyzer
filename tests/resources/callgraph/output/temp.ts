import {Type} from 'class-transformer';
import {plainToclass} from 'class-transformer';


export class Car{
  data:string;
  test(): string {
    let $temp1: string;
    let $temp2: string;
    
    $temp1 = 'hello';
    console.log($temp1);
    $temp2 = 'hello. this is my car';
    return $temp2;
  }
}
export class User{
  id:number;
  firstName:string;
  lastName:string;
  Type car:Car;
}
export function deserialize(data: string): User {
  let jsonObj: any;
  let ans: User;
  let $temp2: AnonymousClass$deserialize$0;
  
  
  jsonObj = JSON.parse(data);
  $temp2 = new AnonymousClass$deserialize$0();
  ans = plainToclass(User,jsonObj,$temp2);
  return ans;
}
class AnonymousClass$deserialize$0{
}
export function test(data: string): void {
  let $temp2: User;
  let $temp3: any;
  let $temp4: any;
  
  
  $temp2 = deserialize(data);
  $temp3 = $temp2.car;
  $temp4 = $temp3.test();
  console.log($temp4);
  
}
