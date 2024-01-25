import { AbstractInvokeExpr, ArkBinopExpr } from "../base/Expr";
import { ArkInstanceFieldRef } from "../base/Ref";
import { Value } from "../base/Value";


export class IRUtils {
    static moreThanOneAddress(value: Value): boolean {
        if (value instanceof ArkBinopExpr || value instanceof AbstractInvokeExpr || value instanceof ArkInstanceFieldRef) {
            return true;
        }
        return false;
    }
}