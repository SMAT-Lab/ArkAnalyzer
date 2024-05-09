/**
 * 11/11
 * 3/3
 * testcase_16_parameter.ts
 * 3(0)/3
 */

function withParamString(param: string) {
    
}

class Class1 {
    public a: string

    constructor(word: string) {
        this.a = word
    }

    public getWord(): string {
        return this.a
    }
}

let cla: Class1 = new Class1("not fun")
withParamString(cla.getWord())