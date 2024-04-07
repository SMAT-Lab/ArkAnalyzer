class Foo {
    private i: number = 0;
    public static j: number = 1;

    constructor() {
    }

    public bar() {
        const foo = new Foo();
        let ii = foo.i;
        let jj = Foo.j;
        foo.func2();

        Foo.func1();

        let k = 1 + 2;
    }


    public static func1() {

    }

    public func2() {

    }

}