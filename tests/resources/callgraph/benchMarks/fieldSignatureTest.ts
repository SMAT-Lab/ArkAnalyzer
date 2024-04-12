class Foo {
    public i: number = 0
    public static j: number = 0

    public static newFoo(): Foo {
        return new Foo()
    }

    public getNumber(): number {
        let i: number = 0
        let j: number = 1
        return i + j
    }
}

class Bar {
    public useFoo(): void {
        let foo = Foo.newFoo()
        let n: number = foo.getNumber()
        let ii = foo.i
        let jj = Foo.j
    }
}