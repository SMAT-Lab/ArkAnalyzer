import { ArkBody } from "../model/ArkBody";
import { ArkMethod } from "../model/ArkMethod";
import { MethodSignature } from "../model/ArkSignature";
import { CfgBuilder } from "./CfgBuilder";
import * as ts from "typescript";

export class BodyBuilder {
    private cfgBuilder: CfgBuilder;
    private methodSignature: MethodSignature;

    constructor(methodSignature: MethodSignature, sourceAstNode: ts.Node, declaringMethod: ArkMethod, sourceFile: ts.SourceFile) {
        this.methodSignature = methodSignature;
        this.cfgBuilder = new CfgBuilder(sourceAstNode, this.methodSignature.getMethodSubSignature().getMethodName(), declaringMethod, sourceFile);
    }

    public build(): ArkBody {
        let cfg = this.cfgBuilder.buildCfg();
        cfg.buildDefUseStmt();
        let originalCfg = this.cfgBuilder.buildOriginalCfg();
        let locals = new Set(this.cfgBuilder.getLocals());

        return new ArkBody(this.methodSignature, locals, originalCfg, cfg);
    }
}