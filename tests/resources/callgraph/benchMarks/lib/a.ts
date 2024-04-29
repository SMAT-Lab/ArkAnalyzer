import { B } from "./b";
import Logger from "../../../../../src/utils/logger";
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
    public static num = 1
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

    public getDog(): Dog {
        return this
    }

    public returnStr(str: string): string {
        return str + "3"
    }
}

export class Cat extends Animal {
    public sound() {
        logger.info("meewo")
    }

    public testWithParams(a: Dog): void {
        // logger.info(a)
        this.sound()
        a.sleep()
    }

    public getCat(): Cat {
        return this
    }

    public static getNum(): number {
        return 1 + 2
    }
}

export class Main {
    public static makeAnimalSound(animal: Animal) {
        animal.sound()
    }

    public static main() {
        this.makeAnimalSound(new Dog())
    }

    public getMain(): Main {
        return this
    }

    public static printNumber(num: number): string {
        console.log(num)
        return "success"
    }
}

export class FieldA {
    public field_A: string
    public field_B: FieldB
}

export namespace dd {

}