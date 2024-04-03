import { B } from "./b";
import Logger from "../../../../src/utils/logger";
let logger = Logger.getLogger()

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
        // logger.info("woof")
        let cat = new Cat()
        cat.sound()
        this.sleep()
    }

    public static print() {
        logger.info("waht")
    }

    public sleep() {
    }
}

export class Cat extends Animal {
    public sound() {
        logger.info("meewo")
    }

    public testWithParams(a: Dog) {
        // logger.info(a)
        this.sound()
    }
}

export class Main {
    public static makeAnimalSound(animal: Animal) {
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