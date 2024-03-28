function identity(x: number) : number {
    let y:number = x;
    return y;
}

function nonZero() : number {
    return 1;
}

function zero() : number {
    return 0;
}


function  main(x:number, y:number) {
    x = nonZero();
    y = 3;
    y = zero();
    let c = y/y;
    if (x==0) {
        x = nonZero();
    } else {
        x = 3;
    }
    x = identity(y);
    x = 3/x;
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

function main2() {
    let x = new num().get();
    x = new one().get();
    x = new Zero().get();
}

function func3(){}

function main3(){
    let x = 0;
    func3();
}
