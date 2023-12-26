export abstract class Position {
    public abstract getFirstLine(): number;

    public abstract getLastLine(): number;

    public abstract getFirstCol(): number;

    public abstract getLastCol(): number;
}


export class LinePosition extends Position {
    private readonly lineNo: number;

    constructor(lineNo: number) {
        super();
        this.lineNo = lineNo;
    }

    public getFirstLine(): number {
        return this.lineNo;
    }

    public getLastLine(): number {
        return this.lineNo + 1;
    }

    public getFirstCol(): number {
        return 0;
    }

    public getLastCol(): number {
        return 0;
    }
}
