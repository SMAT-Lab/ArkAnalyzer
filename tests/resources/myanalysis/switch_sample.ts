function viaSwitch(x: number): number {
    let r = 0;
    switch (x) {
        case 1: r = 10; break;
        case 2: r = 20; break;
        default: r = 99;
    }
    return r;
}

function viaIfLadder(x: number): number {
    let r = 0;
    if (x === 1) { r = 10; }
    else if (x === 2) { r = 20; }
    else { r = 99; }
    return r;
}
