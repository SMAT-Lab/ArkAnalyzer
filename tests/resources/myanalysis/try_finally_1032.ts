function tryFinallyLineLoss(): number {
    let r = 0;
    try {
        r = 1;
    } finally {
        r = 2;
    }
    return r;
}
