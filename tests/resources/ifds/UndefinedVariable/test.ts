class t{
    a:number;
    s:string = "s";
    constructor(){

    }

}

function mainU(){
    let t1: t;
    if (true){
        t1 = new t();
        console.log(t1.a);
    }
    console.log(t1.s);
}

// function f(this: { t: string }) {
//     console.log(this.t);
// }