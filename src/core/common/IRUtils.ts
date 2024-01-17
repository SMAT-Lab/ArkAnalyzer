import { ArkBinopExpr, ArkInvokeExpr } from "../base/Expr";
import { ArkFieldRef } from "../base/Ref";
import { Value } from "../base/Value";


export class IRUtils {
    static moreThanOneAddress(value: Value): boolean {
        if (value instanceof ArkBinopExpr || value instanceof ArkInvokeExpr || value instanceof ArkFieldRef) {
            return true;
        }
        return false;
    }
}