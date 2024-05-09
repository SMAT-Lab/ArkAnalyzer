/**
 * 16/17
 * 5/5
 * testcase_17_parameter.ts
 * 5(0)/5
 */
class Word {
    public word: string
    public length: number

    constructor(word: string) {
        this.word = word
        this.length = word.length
    }

    public getWord(): string {
        return this.word
    }

    public getLength(): number {
        return this.length
    }
}
function withParamClass(param: Word) {
    let word = param.getWord()
    let num = param.getLength()

    withParamString(word)
}

function withParamString(param: string) {
    
}

let cls = new Word("fxxxxxx")
withParamClass(cls)