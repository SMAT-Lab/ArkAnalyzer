function f1():number{
    console.log(1)
    return 1
}

function f2(x:number){
    console.log(x)
}

function f3(){
    let x=f1();
    f2(1);
}

// let m:Map<number,number[]>=new Map()
// m.set(1,[2])
// function func(map:Map<number,number[]>){
//     map.get(2)?.push(1);
// }
// func(m);
// for(const x of m.get(2)!){
//     console.log(x)
// }