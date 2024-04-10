class Foo {
    public static newFoo(): Foo {
        return new Foo();
    }

    public getNumber(): number {
        let i: number = 0;
        let j: number = 1;
        return i + j;
    }
}

class Bar {
    public useFoo(): void {
        let foo = Foo.newFoo();
        let i = foo.getNumber();
    }
}