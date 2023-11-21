import * as fs from 'fs';
import { NodeA, ASTree } from './Ast';

export class Statement {
    type: string;
    code: string;
    next: Statement | null;
    walked: boolean;
    index: number;
    posStart: number | string;
    posEnd: number | string;
    constructor(type: string, code: string) {
        this.type = type;
        this.code = code;
        this.next = null;
        this.walked = false;
        this.index = 0;
        this.posStart = 0;// TODO: modify to use real pos number
        this.posEnd = 0;// TODO: modify to use real pos number
    }
}

export class ConditionStatement extends Statement {
    nextT: Statement | null;
    nextF: Statement | null;
    constructor(type: string, code: string) {
        super(type, code);
        this.nextT = null;
        this.nextF = null
    }
}

export class SwitchStatement extends Statement {
    nexts: Statement[];
    constructor(type: string, code: string) {
        super(type, code);
        this.nexts = [];
    }
}