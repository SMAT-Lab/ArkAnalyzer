/**
 * 18/19
 * 3/3
 * 
 * testcase_11_function_call.ts
 */

function main(x:number,y:number) {
    let n = new num();
    n.n=1;
    x = n.get();
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

main(1,2)