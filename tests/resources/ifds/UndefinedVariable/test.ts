import { im } from "./test2";
export class property{
    // @Type(() => t)
    pp=1;
}
@A
class t{
    @Type(()=>a)
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
        console.log(x)
    }
    print(){
        console.log(this.p.pp)
    }
}

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

function U7() {
    console.log(x.pp);
}
export let x:property;
U7();

namespace n{
    x = new property();
    export let y = 1;
    namespace nn{
        export let xnn=1;
    }
    nn.xnn
}

namespace n2{
    n.y=4;
}
console.log(n.y);
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