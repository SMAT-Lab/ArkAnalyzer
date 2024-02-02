import {A, Dog as Cat, Main} from './a'
import {B as C, C as Class, globalNumber, invokeParam} from "./b";
import {func1} from "./temp/a";


A();
C();
let dog: Cat = new Cat()
let mee = new Cat()
// let d: Cat | null = new Cat()
let c = dog.aaaaaaaaaa
// let d = c
// let e = globalNumber

Cat.print()
dog.sound()
Main.main()
func1(1)
invokeParam(1, "b", new Class())


// let a = 3
// let b = 5
// let c = a
// let d = c + a
// let e = a