import { ArkClass } from "../model/ArkClass";
import { ArkFile } from "../model/ArkFile";
import { ArkMethod } from "../model/ArkMethod";
import { ArkNamespace } from "../model/ArkNamespace";
import { MethodSignature } from "../model/ArkSignature";

export class ModelUtils {
    public static getMethodSignatureFromArkClass(arkClass: ArkClass, methodName: string): MethodSignature | null {
        for (const arkMethod of arkClass.getMethods()) {
            if (arkMethod.getName() == methodName) {
                return arkMethod.getSignature();
            }
        }
        return null
    }


    public static getClassWithName(className: string, startFrom: ArkMethod): ArkClass | null {
        //TODO:是否支持类表达式
        const thisClass = startFrom.getDeclaringArkClass();
        if (thisClass.getName() == className) {
            return thisClass;
        }
        const thisNamespace = thisClass.getDeclaringArkNamespace();
        let classSearched: ArkClass | null = null;
        if (thisNamespace) {
            classSearched = this.getClassInNamespaceWithName(className, thisNamespace);
            if (classSearched) {
                return classSearched;
            }
        }
        const thisFile = thisClass.getDeclaringArkFile();
        classSearched = this.getClassInFileWithName(className, thisFile, thisNamespace);
        return classSearched;
    }

    private static getClassInNamespaceWithName(className: string, arkNamespace: ArkNamespace): ArkClass | null {
        for (const arkClass of arkNamespace.getClasses()) {
            if (arkClass.getName() == className) {
                return arkClass;
            }
        }
        return null;
    }

    private static getClassInFileWithName(className: string, arkFile: ArkFile, arkNamespaceExclude?: ArkNamespace): ArkClass | null {
        for (const arkClass of arkFile.getClasses()) {
            if (arkClass.getName() == className) {
                return arkClass;
            }
        }

        let classSearched: ArkClass | null = null;
        for (const arkNamespace of arkFile.getNamespaces()) {
            if (arkNamespaceExclude && arkNamespaceExclude == arkNamespace) {
                continue;
            }
            classSearched = this.getClassInNamespaceWithName(className, arkNamespace);
            if (classSearched) {
                break;
            }
        }
        return classSearched;
    }
}