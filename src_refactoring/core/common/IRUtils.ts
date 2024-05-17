import { AbstractInvokeExpr, ArkBinopExpr } from "../base/Expr";
import { ArkArrayRef, ArkInstanceFieldRef } from "../base/Ref";
import { Value } from "../base/Value";


export class IRUtils {
    static moreThanOneAddress(value: Value): boolean {
        if (value instanceof ArkBinopExpr || value instanceof AbstractInvokeExpr || value instanceof ArkInstanceFieldRef ||
            value instanceof ArkArrayRef) {
            return true;
        }
        return false;
    }
}