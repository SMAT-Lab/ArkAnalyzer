function test() {
    let a = new A();
    delete a.i;
}

class A {
    public i?: number;
}