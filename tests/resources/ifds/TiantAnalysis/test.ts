class Tclass {
    value: number;
    t: Tclass;
    func() {
        sink(this.t);
    }
}

function source(): Tclass{
    return new Tclass();
}
function sink(t: Tclass){}

function T1() {
    let t = new Tclass();
    t.t = source();
    t.func();
}

function source2(): Tclass{
    return new Tclass();
}
function sink2(t: Tclass){}

function tiantIt(inn: Tclass, out: Tclass) {
    let x = out;
    x.t = inn;
    sink(x.t);
}


function T2() {
    let t1 = new Tclass(), t2 = new Tclass();
    tiantIt(source(), t1);
    sink(t1.t);
}