/**
 * 23/26
 * 5/5
 * testcase_23_return.ts
 */
class Return {
    public num: number
    public getNum(): number {
        return this.num
    }

    public addNum(num_a: number, num_b: number): number {
        return this.getNum() + num_a + num_b
    }

    public setNum(num_a: number, num_b: number): number {
        return this.addNum(num_a, this.getNum()) * num_b
    }

    constructor(num: number) {
        this.num = num
    }
}

let ret = new Return(4)
let temp = ret.setNum(0, 1)
