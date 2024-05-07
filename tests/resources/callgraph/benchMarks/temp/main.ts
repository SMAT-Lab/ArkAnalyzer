function identity(x: number) : number {
    console.log("identity(){")
    let y:number = x;
    console.log("}")
    return y;
}

function nonZero() : number {
    console.log("nonZero(){")
    console.log("}")
    return 1;
}

function zero() : number {
    console.log("zero(){")
    console.log("}")
    return 0;
}


function  main(x:number, y:number) {
    console.log("main(){")
    x = nonZero();
    y = 3;
    y = zero();
    if (x==0) {
        x = nonZero();
    } else {
        x = 3;
    }
    x = identity(y);
    console.log("}")
}