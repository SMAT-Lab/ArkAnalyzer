// test case for method call 1
// 8/8
// 4/4
// testcase_6_method_call.ts

import { Cat, Dog } from "./lib/a";

let num = Cat.getNum()
let cat = new Cat()
let cat_2 = cat.getCat()
cat_2.sound()
let a = cat.testWithParams(new Dog())