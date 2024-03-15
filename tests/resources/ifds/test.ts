class t{
    a:number;
    b:number;
    constructor(a:number,b:number){
        this.a=a;
        this.b=b
    }
}

let t1=new t(1,2);
let t2=new t(1,2);
// console.log(t1==t2);
// let set:Set<t>=new Set();
// set.add(t1);
// set.add(t2);
// console.log(set)

let map:Map<t,Set<number>>=new Map()
map.set(t1,new Set([1,2]));
let set:Set<number>=new Set();
for(const tt of Array.from(map.keys())){
    if(tt.a==t2.a&&tt.b==t2.b){
        set=map.get(tt)!
    }
}
console.log(set)

// let m:Map<number,number[]>=new Map()
// m.set(1,[2])
// function func(map:Map<number,number[]>){
//     map.get(2)?.push(1);
// }
// func(m);
// for(const x of m.get(2)!){
//     console.log(x)
// }