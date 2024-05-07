/**
 * 31/32
 * 3/4
 * 
 * testcase_15_function_call.ts
 */

function identity(x: number) : number {
    let y:number = x;
    return y;
}

function nonZero() : number {
    return 1;
}

function zero() : number {
    let z = nonZero()
    return 0;
}

function fun(x:number){
    console.log(x)
}

function func1(a:number,b:number): number{
    if (a == 0){
        b = 1;
        return b;
    }
    if (b != 0){
        return a;
    }
    return 0;
}

class num {
    n:number = 0;
    constructor() {
        this.n=1;
    }
    get():number {
        return -1;
    }
}

class one extends num {
    get(): number {
        return 1;
    }
}

class Zero extends num {
    get(): number {
        return 0;
    }
}

function func3(){}

function main3(){
    let x = 0;
    func3();
}

main3()
