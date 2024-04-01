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

function  main(x:number) {
    fun(0);
    fun(0);
    // let c = y/y;  // zero division
    // if (x==0) {
    //     x = nonZero();
    // } else {
    //     x = 3;
    // }
    // x = x/x;
    // x = identity(y);
    // x = 3/x;  // zero division
    // if (x==0) {
    //     x = 3;
    // } else {
    //     x = 0;
    // }
    // x = x/x; // zero division

    // if (x==0) {
    //     x = 3;
    // } else {
    //     x = zero();
    // }
    // x = x/x; // zero division
}

function func1(a:number,b:number){
    if (a == 0){
        b = 1;
        return b;
    }
    if (b != 0){
        return a;
    }
    return 0;
}

function main1(){
    let x = func1(1,0)
}

class num {
    constructor() {}
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

function main2(a:Zero, b:num, c:one) {
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
    
}

function func3(){}

function main3(){
    let x = 0;
    func3();
}
