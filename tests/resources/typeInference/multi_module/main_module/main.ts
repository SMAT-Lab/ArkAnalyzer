class Foo {
    public foo() {
    }
}

class Bar {
    private foos: Foo[];

    public bar() {
        this.foos.forEach(foo => foo.foo());
    }
}