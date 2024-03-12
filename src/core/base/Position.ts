export abstract class Position {
    public abstract getFirstLine(): number;

    public abstract getLastLine(): number;

    public abstract getFirstCol(): number;

    public abstract getLastCol(): number;
}

export class LinePosition {
    private readonly lineNo: number;

    constructor(lineNo: number) {
        this.lineNo = lineNo;
    }

    public getLineNo(): number {
        return this.lineNo;
    }
}