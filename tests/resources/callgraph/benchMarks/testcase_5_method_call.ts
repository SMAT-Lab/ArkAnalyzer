/**
 * test case for method call 1
 * 6/6
 * 3/3
 * testcase_5_method_call.ts
 * 3(0)/3
 */

import { Dog } from "./lib/a";
console.log("Default_Method")

let dog: Dog = new Dog()
dog.sleep()

let dog_2 = dog.getDog()
let dog_3 = dog_2.returnStr("who knows? ")
