function test() {
    let i = 0;
    let j = i + 1;
    i = 10;
    if (i < 5) {
        i = 100;
    } else {
        i = 200;
    }
    j = i * 2;
}