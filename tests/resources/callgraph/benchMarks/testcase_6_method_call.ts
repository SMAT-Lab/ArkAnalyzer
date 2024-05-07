// test case for method call 1
// 8/8
// 4/4
// testcase_6_method_call.ts
// 6(0)/6

import { Cat, Dog } from "./lib/a";
console.log("Default_Method")

let num = Cat.getNum()
let cat = new Cat()
let cat_2 = cat.getCat()
cat_2.sound()
let a = cat.testWithParams(new Dog())