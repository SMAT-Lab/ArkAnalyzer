import fs from 'fs';

export interface ArkDump {
    dump(streamOut: ArkStream): void;
}

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

    public close(): void {
        this.streamOut.close();
    }
}