/**
 * 22/23
 * 6/7
 * 
 * testcase_12_function_call.ts
 * 6(0)/6
 */

class num {
    n:number = 0;
    constructor() {
        console.log("num.constructor(){")
        this.n=1;
        console.log("}")
    }
    get():number {
        console.log("num.get(){")
        console.log("}")
        return -1;
    }
}

class one extends num {
    get(): number {
        console.log("one.get(){")
        console.log("}")
        return 1;
    }
}

class Zero extends num {
    get(): number {
        console.log("zero.get(){")
        console.log("}")
        return 0;
    }
}

function main2(a:Zero, b:num, c:one) {
    console.log("main2(){")
    let x = c.get();
    x = x/x;
    x = b.get();
    x = x/x;
    x = 1;
    x = x/x;
    x = a.get();
    x = x/x;
    let n : num = new num();
    let y = n.get();
    y = y/y;
    console.log("}")
}

main2(new Zero(), new num(), new one())