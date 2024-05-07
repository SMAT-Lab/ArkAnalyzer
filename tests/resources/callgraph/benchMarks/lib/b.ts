export function B(){
    console.log("B(){")
    console.log("this is function B")
    console.log("}")
}

export class C {

}

// export let globalNumber = 1

export function invokeParam(a: number, b: string, c: C) {
    console.log("invokeParam(){")
    // let d = a
    // let e = b
    // let f = c
    console.log("}")
}

function temp(a: boolean) {
    console.log("temp(){")
    // let c = a
    let d: boolean = true
    let str: string = `boy, hello ${d}`
    // let b = "a"
    // let a = "b"
    // let c = a + b
    console.log("}")
}
