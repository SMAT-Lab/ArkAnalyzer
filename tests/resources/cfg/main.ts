function test() {
    let sa = [1, 2];
    for (const s of sa) {
        console.log(s);
    }

    for (const s in sa) {
        console.log(s);
    }
}