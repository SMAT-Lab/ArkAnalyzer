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