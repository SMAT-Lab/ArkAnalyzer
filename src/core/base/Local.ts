/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Stmt } from './Stmt';
import { ClassType, FunctionType, Type, UnknownType } from './Type';
import { Value } from './Value';
import { TypeInference } from '../common/TypeInference';
import { ArkExport, ExportType } from '../model/ArkExport';
import { ClassSignature, LocalSignature, MethodSignature } from '../model/ArkSignature';
import { ArkSignatureBuilder } from '../model/builder/ArkSignatureBuilder';
import { NAME_PREFIX, UNKNOWN_METHOD_NAME } from '../common/Const';
import { ModifierType } from '../model/ArkBaseModel';
import { ArkMethod } from '../model/ArkMethod';
import { ModelUtils } from '../common/ModelUtils';
import { THIS_NAME } from '../common/TSConst';

/**
 * @category core/base
 */
export class Local implements Value, ArkExport {
    private name: string;
    private type: Type;

    private originalValue: Value | null;

    private declaringStmt: Stmt | null;
    private usedStmts: Stmt[];
    private signature?: LocalSignature;
    private constFlag?: boolean;

    constructor(name: string, type: Type = UnknownType.getInstance()) {
        this.name = name;
        this.type = type;

        this.originalValue = null;
        this.declaringStmt = null;
        this.usedStmts = [];
    }

    public inferType(arkMethod: ArkMethod): Local {
        if (this.name === THIS_NAME && this.type instanceof UnknownType) {
            const declaringArkClass = arkMethod.getDeclaringArkClass();
            this.type = new ClassType(declaringArkClass.getSignature(), declaringArkClass.getRealTypes());
        } else if (!this.name.startsWith(NAME_PREFIX) && TypeInference.isUnclearType(this.type)) {
            const type = TypeInference.inferBaseType(this.name, arkMethod.getDeclaringArkClass()) ??
                ModelUtils.findDeclaredLocal(this, arkMethod)?.getType();
            if (type) {
                this.type = type;
            }
        }
        if (this.type instanceof FunctionType) {
            this.type.getMethodSignature().getMethodSubSignature().getParameters()
                .forEach(p => TypeInference.inferParameterType(p, arkMethod));
            TypeInference.inferSignatureReturnType(this.type.getMethodSignature(), arkMethod);
        }
        return this;
    }

    /**
     * Returns the name of local value.
     * @returns The name of local value.
     * @example
     * 1. get the name of local value.

     ```typescript
     arkClass.getDefaultArkMethod()?.getBody().getLocals().forEach(local => {
     const arkField = new ArkField();
     arkField.setFieldType(ArkField.DEFAULT_ARK_Field);
     arkField.setDeclaringClass(defaultClass);
     arkField.setType(local.getType());
     arkField.setName(local.getName());
     arkField.genSignature();
     defaultClass.addField(arkField);
     });
     ```
     */
    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    /**
     * Returns the type of this local.
     * @returns The type of this local.
     */
    public getType(): Type {
        return this.type;
    }

    public setType(newType: Type): void {
        this.type = newType;
    }

    public getOriginalValue(): Value | null {
        return this.originalValue;
    }

    public setOriginalValue(originalValue: Value): void {
        this.originalValue = originalValue;
    }

    /**
     * Returns the declaring statement, which may also be a **null**.
     * For example, if the code snippet in a function is `let dd = cc + 5;` where `cc` is a **number**
     * and `dd` is not defined before, then the declaring statemet of local `dd`:
     * - its **string** text is "dd = cc + 5".
     * - the **strings** of right operand and left operand are "cc + 5" and "dd", respectively.
     * - three values are used in this statement: `cc + 5` (i.e., a normal binary operation expression), `cc` (a local), and `5` (a constant), respectively.
     * @returns The declaring statement (maybe a **null**) of the local.
     * @example
     * 1. get the statement that defines the local for the first time.

     ```typescript
     let stmt = local.getDeclaringStmt();
     if (stmt !== null) {
     ...
     }
     ```
     */
    public getDeclaringStmt(): Stmt | null {
        return this.declaringStmt;
    }

    public setDeclaringStmt(declaringStmt: Stmt): void {
        this.declaringStmt = declaringStmt;
    }

    /**
     * Returns an **array** of values which are contained in this local.
     * @returns An **array** of values used by this local.
     */
    public getUses(): Value[] {
        return [];
    }

    public addUsedStmt(usedStmt: Stmt): void {
        this.usedStmts.push(usedStmt);
    }

    /**
     * Returns an array of statements used by the local, i.e., the statements in which the local participate.
     * For example, if the code snippet is `let dd = cc + 5;` where `cc` is a local and `cc` only appears once,
     * then the length of **array** returned is 1 and `Stmts[0]` will be same as the example described
     * in the `Local.getDeclaringStmt()`.
     * @returns An array of statements used by the local.
     */
    public getUsedStmts(): Stmt[] {
        return this.usedStmts;
    }

    /**
     * Get a string of local name in Local
     * @returns The string of local name.
     * @example
     * 1. get a name string.

     ```typescript
     for (const value of stmt.getUses()) {
     const name = value.toString();
     ...
     }
     ```
     */
    public toString(): string {
        return this.getName();
    }

    public getExportType(): ExportType {
        return ExportType.LOCAL;
    }

    public getModifiers(): number {
        return 0;
    }

    public containsModifier(modifierType: ModifierType): boolean {
        if (modifierType === ModifierType.CONST) {
            return this.getConstFlag();
        }
        return false;
    }

    public getSignature(): LocalSignature {
        return (
            this.signature ??
            new LocalSignature(
                this.name,
                new MethodSignature(ClassSignature.DEFAULT, ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(UNKNOWN_METHOD_NAME))
            )
        );
    }

    public setSignature(signature: LocalSignature): void {
        this.signature = signature;
    }

    public getConstFlag(): boolean {
        if (!this.constFlag) {
            return false;
        }
        return this.constFlag;
    }

    public setConstFlag(newConstFlag: boolean): void {
        this.constFlag = newConstFlag;
    }
}
