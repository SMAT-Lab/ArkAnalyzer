import fs from 'fs';

function test() {
    const sampleData: number[] = [1, 2, 3, 4, 5];

    for (let i = 0; i < sampleData.length; i++) {
        // 使用 if 判断
        if (sampleData[i] % 2 === 0) {
            console.log(`${sampleData[i]} 是偶数`);
        } else {
            console.log(`${sampleData[i]} 是奇数`);
        }

        // 使用 switch 判断
        switch (sampleData[i] % 3) {
            case 0:
                console.log(`${sampleData[i]} 可被 3 整除`);
                break;
            case 1:
                console.log(`${sampleData[i]} 除以 3 余 1`);
                break;
            case 2:
                console.log(`${sampleData[i]} 除以 3 余 2`);
                break;
            default:
                console.log("无法判断");
        }

        // 使用 while 循环
        let count = 0;
        while (count < sampleData[i]) {
            console.log(`当前计数: ${count}`);
            count++;
        }

        // 使用 for 循环和 continue
        for (let j = 0; j < 5; j++) {
            if (j === 2) {
                continue; // 跳过本次循环的剩余代码，进入下一次循环
            }
            console.log(`当前内层循环计数: ${j}`);
        }

        // 使用 break 终止循环
        for (let k = 0; k < 3; k++) {
            console.log(`外层循环计数: ${k}`);
            if (k === 1) {
                break; // 终止整个循环
            }
        }
    }
}

class Person {
    x:number = 0;
    
    constructor(public age:number) {}
    growOld = () => {
        this.age++;
    }

    public getAge() {
        return this.age
    }

    static wooooof() {
        console.log("not a person sound")
    }
}

export function classMethodTest() {
    let notPerson = new Person(10);
    let x = new Map();
    let z = new Error();
    let y = test();
    let a = notPerson.age
    notPerson.growOld()
    Person.wooooof()
}

interface Alarm {
    alert(): void;
}

interface Alarm2 {
    alert2(): void;
}

class Door {
}

export default function foo(x: number): number {
    var y: number = 0;
    for (let k = 0; k < x; k++) {
        y = y + k;
    }
    return y;
}

class Adder {
    constructor(public a: number) { }
    // This function is now safe to pass around
    add = (b: string): string => {
        return this.a + b;
    }
}

class ExtendedAdder extends Adder {
    // Create a copy of parent before creating our own
    private superAdd = this.add;
    // Now create our override
    add = (b: string): string => {
        return this.superAdd(b);
    }
}

export function listParameters(u: number, v: number, w: string): { x: number, y: number, z: string } {
    return { x: u, y: v, z: w }
}

export class SecurityDoor extends Door implements Alarm, Alarm2 {
    x: number = 0;
    y: string = '';
    alert(): void {
        console.log("SecurityDoor alert");
    }
    alert2(): void {
        console.log("SecurityDoor alert2");
    }
    public Members = class {

    }
    public fooo() {
        console.log("This is fooo!");
    }
    constructor(x: number, y: string) {
        super();
        this.x = x;
        this.y = y;
        console.log("This is a constrctor!");
    }
}

abstract class Animal {
    public name;
    public constructor(name:string) {
      this.name = name;
    }
    public abstract sayHi():void;
  }