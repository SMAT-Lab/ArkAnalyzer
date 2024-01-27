
import { NodeA } from "../base/Ast";
import { ArkBody } from "../model/ArkBody";
import { ArkClass } from "../model/ArkClass";
import { MethodSignature } from "../model/ArkSignature";
import { CfgBuilder } from "./CfgBuilder";

export class BodyBuilder {
    private cfgBuilder: CfgBuilder;
    private methodSignature: MethodSignature;

    constructor(methodSignature: MethodSignature, sourceAstNode: NodeA, declaringClass: ArkClass) {
        this.methodSignature = methodSignature;
        this.cfgBuilder = new CfgBuilder(sourceAstNode, this.methodSignature.getMethodSubSignature().getMethodName(), declaringClass);
    }

    public build(): ArkBody {
        let cfg = this.cfgBuilder.buildCfg();
        // cfg.defUseChain();
        let originalCfg = this.cfgBuilder.buildOriginalCfg();
        let locals = new Set(this.cfgBuilder.getLocals());

        return new ArkBody(this.methodSignature, locals, originalCfg, cfg);
    }
}