function main() {
    let flag = true;
    if (flag) {
        log('if then')
    }
    else {
        log('if else')
    }

    let cnt: number = 3;
    for (let i = 0; i < cnt; i++) {
        console.log('for:' + i);
    }

    let s = 'hi'
}


function log(s: string): void {
    console.log(s);
}