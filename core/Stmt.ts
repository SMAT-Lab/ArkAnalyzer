
export class Stmt {
    content:string;
    lineNo:number;

    constructor(content:string, lineNo:number) {
        this.content = content;
        this.lineNo = lineNo;
    }
}