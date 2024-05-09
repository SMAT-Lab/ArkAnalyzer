/**
 * 31/32
 * 3/4
 * 
 * testcase_14_function_call.ts
 * 2(0)/2
 */

function identity(x: number) : number {
    console.log("iden")
    let y:number = x;
    console.log("}")
    return y;
}

function nonZero() : number {
    console.log("nonzero")
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
        console.log("constru")
        this.n=1;
        console.log("}")
    }
    get():number {
        console.log("num.get")
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


main1()