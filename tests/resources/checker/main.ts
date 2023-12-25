class Data {
    x?: number;
    y?: number;
}

let d = new Data();
d.x = 1;
d.y = 2;
delete d.x;

function func() {
    let obj = {};
    obj['x'] = 10;
    obj['y'] = 20;
    delete obj['x'];
}