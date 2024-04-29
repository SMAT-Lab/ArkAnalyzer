import { C2,f } from "./t2";

class C {
    public d: number;
    constructor(d: number) {
        this.d = d;
    }
}
class B {
    public c: C;
    constructor(c: C) {
        this.c = c;
    }
}
export class A {
    public b: B;
    constructor(b: B) {
        this.b = b;
    }
}
function tac(){
    const c = new C(10);
    const b = new B(c);
    const a = new A(b);
    const x = 1, y = 2, z = 3;
    console.log((a.b.c.d + x) % y - z);
}

export namespace t{
    export namespace t1{
        export class t1c {
            static n=1;
        }
        export namespace t11{
            export class t11c {
                static n=1;
            }
        }
    }
    
    namespace t2{
        let x = t1.t11.t11c.n,y=C2.n
        export class t2c{
            static n=1;
        }
        export namespace t21{
            export class t21c {
                static n=1;
            }
        }
    }
}