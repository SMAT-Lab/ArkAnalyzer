export class Decorator {
    kind: string;
    constructor(name: string) {
        this.kind = name;
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