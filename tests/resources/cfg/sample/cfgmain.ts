class Foo {
    public foo: Foo | undefined;

    public bar(): void {
        let foo = new Foo();
        foo!.foo!.foo = new Foo();
    }
}

