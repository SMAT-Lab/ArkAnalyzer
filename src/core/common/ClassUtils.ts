import { ArkClass } from "../model/ArkClass";
import { MethodSignature } from "../model/ArkSignature";

export class ClassUtils {
    public static getMethodSignatureFromArkClass(arkClass: ArkClass, methodName: string): MethodSignature | null {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() == methodName) {
                return arkMethod.getSignature();
            }
        }
        return null
    }
}