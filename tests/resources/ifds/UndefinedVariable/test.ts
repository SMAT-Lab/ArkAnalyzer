import { im } from "./test2";
export class property{
    pp=1;
}

class t{
    static s:property;
    p:property;
    constructor(){
    }
    static sm(){
        // this.s = new property()
        console.log(this.s.pp)
        console.log(t.s.pp)
    }
    method(){
        console.log(t.s)
        x=3
        console.log(x)
    }
    print(){
        console.log(this.p.pp)
    }
}
declare let y;
const tt = new t()
tt.method()
let x=1;
function U2(){
    let t1 = new t();
    // t1.p = new property() 
    t1.print();
}

function U3(){
    let t1 = new t();
    // t1.p = new property() 
    print(t1)
}

function print(tp:t){
    console.log(tp.p.pp);
}

function U4(){
    // t.s = new property()
    console.log(t.s.pp)
}

function U5(){
    t.sm()
}

function U6() {
    im();
}
// function U(){
//     let t1: t;
//     if (true){
//         t1 = new t();
//         console.log(t1.a);
//     }
//     console.log(t1.s);
// }

// function f(this: { t: string }) {
//     console.log(this.t);
// }