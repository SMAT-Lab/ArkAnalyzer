import ts from "typescript";

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

export class LineColPosition {
    private readonly lineNo: number;
    private readonly colNo: number;

    constructor(lineNo: number, colNo: number) {
        this.lineNo = lineNo;
        this.colNo = colNo;
    }

    public getLineNo(): number {
        return this.lineNo;
    }

    public getColNo(): number {
        return this.colNo;
    }

    public static buildFromNode(node: ts.Node, sourceFile: ts.SourceFile) {
        let { line, character } = ts.getLineAndCharacterOfPosition(
            sourceFile,
            node.getStart(sourceFile)
        );
        // line start from 1.
        return new LineColPosition(line + 1, character);
    }
}