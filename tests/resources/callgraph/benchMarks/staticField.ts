class property{
    pp=1;
}

class t{
    static s:property;
    p:property;
    constructor(){
    }
    static sm(){
        console.log(this.s)
        console.log(t.s)
    }
    method(){
        console.log(t.s)
    }
    print(){
        console.log(this.p.pp)
    }
}

function U4() {
    t.s = new property()
    console.log(t.s.pp)
}