/**
 * 48/49
 * 6/7
 * 
 * testcase_13_function_call.ts
 * 5(0)/5
 */

function identity(x: number) : number {
    console.log("identity")
    let y:number = x;
    console.log("}")
    return y;
}

function nonZero() : number {
    console.log("nonZero")
    console.log("}")
    return 1;
}

function zero() : number {
    console.log("zero")
    let z = nonZero()
    console.log("}")
    return 0;
}

function fun(x:number){
    console.log("fun")
    console.log(x)
    console.log("}")
}

function  main(x:number,y:number) {
    console.log("main")
    // let n = new num();
    // n.n=1;
    // x = n.get();
    let c = y/y;  // zero division
    if (x==0) {
        x = nonZero();
    } else {
        x = 3;
    }
    x = x/x;
    x = identity(y);
    x = 3/x;  // zero division
    if (x==0) {
        x = 3;
    } else {
        x = 0;
    }
    x = x/x; // zero division

    if (x==0) {
        x = 3;
    } else {
        x = zero();
    }
    x = x/x; // zero division
    console.log("}")
}

function func1(a:number,b:number): number{
    console.log("func1")
    if (a == 0){
        b = 1;
        console.log("}")
        return b;
    }
    if (b != 0){
        console.log("}")
        return a;
    }
    console.log("}")
    return 0;
}

function main1(){
    console.log("main1")
    let x = func1(1,0)
    console.log("}")
}

class num {
    n:number = 0;
    constructor() {
        console.log("constr")
        this.n=1;
        console.log("}")
    }
    get():number {
        console.log("get")
        console.log("}")
        return -1;
    }
}

class one extends num {
    get(): number {
        console.log("one.get")
        console.log("}")
        return 1;
    }
}

class Zero extends num {
    get(): number {
        console.log("zero.get")
        console.log("}")
        return 0;
    }
}

function func3(){
    console.log("func3")
    console.log("}")
}

main(0, 0)