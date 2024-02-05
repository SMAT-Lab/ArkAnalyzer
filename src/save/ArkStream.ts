import fs from 'fs';

export class ArkStream {
    streamOut: fs.WriteStream;
    indent: string = '';

    constructor(streamOut: fs.WriteStream) {
        this.streamOut = streamOut;
    }

    public write(s: string): this {
        this.streamOut.write(s);
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
        this.write('\'');
        this.write(s);
        this.write('\'');
        return this;
    }

    public writeIndent(): this {
        this.write(this.indent);
        return this;
    }

    public incIndent(): this {
        this.indent += '    ';
        return this;
    }

    public decIndent(): this {
        if (this.indent.length >= 4) {
            this.indent = this.indent.substring(0, this.indent.length - 4);
        }
        return this;
    }

    public getIndent(): string {
        return this.indent;
    }

    public close(): void {
        this.streamOut.close();
    }
}