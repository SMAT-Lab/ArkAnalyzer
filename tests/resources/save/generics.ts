function identity<T>(arg: T): T {
    return arg;
}
let myIdentity: <T>(arg: T) => T = identity;

// TODO: <string> lost
let output = identity<string>("myString");

class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}

interface Lengthwise {
    length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
    console.log(arg.length);  // Now we know it has a .length property, so no more error
    return arg;
}

class BeeKeeper {
    hasMask: boolean;
}

class ZooKeeper {
    nametag: string;
}

class Animal1 {
    numLegs: number;
}

class Bee extends Animal1 {
    keeper: BeeKeeper;
}

class Lion extends Animal1 {
    keeper: ZooKeeper;
}

// TODO: not support
function createInstance<A extends Animal1>(c: new () => A): A {
    return new c();
}

let l = new Lion();
console.log(l.keeper);


