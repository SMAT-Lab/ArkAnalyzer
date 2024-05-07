/**
 * 22/23
 * 6/7
 * 
 * testcase_12_function_call.ts
 */

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

main2(new Zero(), new num(), new one())