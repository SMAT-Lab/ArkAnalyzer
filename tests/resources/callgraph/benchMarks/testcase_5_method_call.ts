// test case for method call 1

import { Dog } from "./lib/a";

let dog: Dog = new Dog()
dog.sleep()

let dog_2 = dog.getDog()
let dog_3 = dog_2.returnStr("who knows? ")