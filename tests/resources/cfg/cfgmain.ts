function test() {
    let a = 'a';
    a = globalThis[a + 'b'];

    let b = [1, 2, 3];
    let c = b[0];

    let d = `hi, ${a}`
}