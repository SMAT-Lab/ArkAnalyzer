export class Decorator {
    kind: string;
    content: string;
    constructor(name: string) {
        this.kind = name;
    }
    public getKind(): string {
        return this.kind;
    }
    public setContent(content: string) {
        this.content = content;
    }
    public getContent(): string {
        return this.content;
    }
}

export class TypeDecorator extends Decorator {
    type: string;
    constructor() {
        super("Type");
    }
    public setType(type: string) {
        this.type = type;
    }
    public getType() {
        return this.type;
    }
}