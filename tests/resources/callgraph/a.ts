import { B } from "./b";
import {C as D} from "./b"

export function A(){
    B();
}
class FieldB {
    public field_C: number
}

export abstract class Animal {
    public sound() {}
}

export class Dog extends Animal {
    public aaaaaaaaaa: number
    public static num: FieldB = new FieldB()
    public sound() {
        console.log("woof")
        let cat = new Cat()
        cat.sound()
    }

    public static print() {
        console.log("waht")
    }
}

export class Cat extends Animal {
    public sound() {
        console.log("meewo")
    }
}

export class Main {
    public static makeAnimalSound(animal: Animal) {
        // let b = 1
        animal.sound()
    }

    public static main() {
        this.makeAnimalSound(new Dog())
    }
}

export class FieldA {
    public field_A: string
    public field_B: FieldB
}

export namespace dd {

}