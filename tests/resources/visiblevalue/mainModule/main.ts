class Foo {
    private bar: number = 1;
    public static bar2: number = 3;
    public fooFunc1(): void {
        let localValue1 = 1;
        if (localValue1 > 1) {
            let localValue2 = 1;
        } else {
            let localValue3 = 1;
        }

    }
}