class t{
    a:number;
    s:string = "s";
    constructor(){

    }

    add(){
        this.a++;
    }
}

function main(){
    let t1: t;
    if (true){
        t1 = new t();
        console.log(t1.a);
    }
    console.log(t1.s);
}