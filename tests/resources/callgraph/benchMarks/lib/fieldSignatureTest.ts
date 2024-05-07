class Foo {
    public i: number = 0
    public static j: number = 0

    public static newFoo(): Foo {
        console.log("Foo.newFoo(){")
        console.log("}")
        return new Foo()
    }

    public getNumber(): number {
        console.log("Foo.getNumber(){")
        let i: number = 0
        let j: number = 1
        console.log("}")
        return i + j
    }
}

class Bar {
    public useFoo(): void {
        console.log("Bar.useFoo(){")
        let foo = Foo.newFoo()
        let n: number = foo.getNumber()
        let ii = foo.i
        let jj = Foo.j
        console.log("}")
    }
}