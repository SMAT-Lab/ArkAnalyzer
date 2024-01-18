import { Local } from '../base/Local';
import { Cfg } from '../graph/Cfg';
import { MethodSignature } from './ArkSignature';

export class ArkBody {
    private locals: Set<Local>;
    private originalCfg: Cfg;
    private cfg: Cfg;
    private methodSignature: MethodSignature;


    constructor(methodSignature: MethodSignature, locals: Set<Local>, originalCfg: Cfg, cfg: Cfg) {
        this.methodSignature = methodSignature;
        this.locals = locals;
        this.originalCfg = originalCfg;
        this.cfg = cfg;
    }

    public getLocals(): Set<Local> {
        return this.locals;
    }

    public setLocals(locals: Set<Local>): void {
        this.locals = locals;
    }

    public getCfg(): Cfg {
        return this.cfg
    }

    public setCfg(cfg: Cfg): void {
        this.cfg = cfg;
    }

    public getOriginalCfg(): Cfg {
        return this.originalCfg
    }

    public setOriginalCfg(originalCfg: Cfg): void {
        this.originalCfg = originalCfg;
    }

    public getMethodSignature(): MethodSignature {
        return this.methodSignature;
    }

    public setMethodSignature(methodSignature: MethodSignature): void {
        this.methodSignature = methodSignature;
    }
}