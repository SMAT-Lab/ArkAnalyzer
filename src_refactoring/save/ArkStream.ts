import fs from 'fs';

export class ArkCodeBuffer {
    output: string[] = [];
    indent: string = '';

    constructor(indent: string='') {
        this.indent = indent;
    }

    public write(s: string): this {
        this.output.push(s);
        return this;
    }

    public writeLine(s: string): this {
        this.write(s);
        this.write('\n');
        return this;
    }

    public writeSpace(s: string): this {
        if (s.length == 0) {
            return this;
        }
        this.write(s);
        this.write(' ');
        return this;
    }

    public writeStringLiteral(s: string): this {
        this.write(`'${s}'`);
        return this;
    }

    public writeIndent(): this {
        this.write(this.indent);
        return this;
    }

    public incIndent(): this {
        this.indent += '  ';
        return this;
    }

    public decIndent(): this {
        if (this.indent.length >= 2) {
            this.indent = this.indent.substring(0, this.indent.length - 2);
        }
        return this;
    }

    public getIndent(): string {
        return this.indent;
    }

    public toString(): string {
        return this.output.join('');
    }
}

export class ArkStream extends ArkCodeBuffer{
    streamOut: fs.WriteStream;

    constructor(streamOut: fs.WriteStream) {
        super('');
        this.streamOut = streamOut;
    }

    public write(s: string): this {
        this.streamOut.write(s);
        return this;
    }

    public close(): void {
        this.streamOut.close();
    }
}