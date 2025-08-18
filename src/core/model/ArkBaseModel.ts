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

import ts from 'ohos-typescript';
import { Decorator } from '../base/Decorator';
import { COMPONENT_DECORATOR, ENTRY_DECORATOR, BUILDER_PARAM_DECORATOR, BUILDER_DECORATOR } from '../common/EtsConst';
import { ArkError, ArkErrorCode } from '../common/ArkError';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ArkMetadata, ArkMetadataKind, ArkMetadataType } from './ArkMetadata';
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkBaseModel');

const COMPONENT_MEMBER_DECORATORS: Set<string> = new Set([
    'State',
    'Prop',
    'Link',
    'StorageProp',
    'StorageLink',
    'Provide',
    'Consume',
    'ObjectLink',
    'LocalStorageLink',
    'LocalStorageProp',
    'Local',
    'Param',
    'Event',
    'Provider',
    'Consumer',
]);

export enum ModifierType {
    PRIVATE = 1,
    PROTECTED = 1 << 1,
    PUBLIC = 1 << 2,
    EXPORT = 1 << 3,
    STATIC = 1 << 4,
    ABSTRACT = 1 << 5,
    ASYNC = 1 << 6,
    CONST = 1 << 7,
    ACCESSOR = 1 << 8,
    DEFAULT = 1 << 9,
    IN = 1 << 10,
    READONLY = 1 << 11,
    OUT = 1 << 12,
    OVERRIDE = 1 << 13,
    DECLARE = 1 << 14,
    // The following are CXX specific modifiers.
    AUTO = 1 << 20,
    EXTERN = 1 << 21,
    FRIEND = 1 << 22,
    VIRTUAL = 1 << 23,
    PURE_VIRTUAL = 1 << 24,
}

export const MODIFIER_TYPE_MASK = 0xffff;

const MODIFIER_TYPE_STRINGS = [
    'private',
    'protected',
    'public',
    'export',
    'static',
    'abstract',
    'async',
    'const',
    'accessor',
    'default',
    'in',
    'readonly',
    'out',
    'override',
    'declare',
];

/**
 *Map the C++modifier keyword to the corresponding modifier type enumeration value
 *
 *This constant defines a Map object, which is used to map the modifier keyword string in C++language to
 *The corresponding ModifierType enumeration value is convenient for type identification and processing during code analysis and conversion.
 *
 *Included modifier mapping relationship:
 *- virtual ->ModifierType.VIRTUAL: virtual function modifier
 *- const ->ModifierType.CONST: constant modifier
 *- private ->ModifierType.PRIVATE: private access modifier
 *- protected ->ModifierType.PROTECTED: protect access modifier
 *- public ->ModifierType.PUBLIC: public access modifier
 *- extern ->ModifierType.EXTERN: external link modifier
 *- friend ->ModifierType.FRIEND: Friend modifier
 *- override ->ModifierType.OVERRIDE: override modifier
 *- static ->ModifierType.STATIC: static modifier
 *- pure virtual ->ModifierType.PURE_VIRTUAL: pure virtual function modifier
 *- abstract ->ModifierType.ABSTRACT: abstract class modifier (implemented through pure virtual function in C++)
 */
const MODIFIER_KIND_2_ENUM_CPP = new Map<string, ModifierType>([
    ['virtual', ModifierType.VIRTUAL],
    ['const', ModifierType.CONST],
    ['private', ModifierType.PRIVATE],
    ['protected', ModifierType.PROTECTED],
    ['public', ModifierType.PUBLIC],
    ['extern', ModifierType.EXTERN],
    ['friend', ModifierType.FRIEND],
    ['override', ModifierType.OVERRIDE],
    ['static', ModifierType.STATIC],
    ['pure virtual', ModifierType.PURE_VIRTUAL],
    // In C++, a class with pure virtual functions is an abstract class. This sets a modifier to correspond to the abstract class in TypeScript.
    ['abstract', ModifierType.ABSTRACT],
]);

const MODIFIER_KIND_2_ENUM = new Map<ts.SyntaxKind, ModifierType>([
    [ts.SyntaxKind.AbstractKeyword, ModifierType.ABSTRACT],
    [ts.SyntaxKind.AccessorKeyword, ModifierType.ACCESSOR],
    [ts.SyntaxKind.AsyncKeyword, ModifierType.ASYNC],
    [ts.SyntaxKind.ConstKeyword, ModifierType.CONST],
    [ts.SyntaxKind.DeclareKeyword, ModifierType.DECLARE],
    [ts.SyntaxKind.DefaultKeyword, ModifierType.DEFAULT],
    [ts.SyntaxKind.ExportKeyword, ModifierType.EXPORT],
    [ts.SyntaxKind.InKeyword, ModifierType.IN],
    [ts.SyntaxKind.PrivateKeyword, ModifierType.PRIVATE],
    [ts.SyntaxKind.ProtectedKeyword, ModifierType.PROTECTED],
    [ts.SyntaxKind.PublicKeyword, ModifierType.PUBLIC],
    [ts.SyntaxKind.ReadonlyKeyword, ModifierType.READONLY],
    [ts.SyntaxKind.OutKeyword, ModifierType.OUT],
    [ts.SyntaxKind.OverrideKeyword, ModifierType.OVERRIDE],
    [ts.SyntaxKind.StaticKeyword, ModifierType.STATIC],
]);

export function modifierKind2Enum(kind: ts.SyntaxKind): ModifierType {
    return MODIFIER_KIND_2_ENUM.get(kind)!;
}

export function modifierKind2EnumCpp(kind: string): ModifierType {
    return MODIFIER_KIND_2_ENUM_CPP.get(kind)!;
}

export function modifiers2stringArray(modifiers: number): string[] {
    let strs: string[] = [];
    for (let idx = 0; idx < MODIFIER_TYPE_STRINGS.length; idx++) {
        if (modifiers & 0x01) {
            strs.push(MODIFIER_TYPE_STRINGS[idx]);
        }
        modifiers = modifiers >>> 1;
    }
    return strs;
}

export abstract class ArkBaseModel {
    protected modifiers?: number;
    protected decorators?: Set<Decorator>;
    protected metadata?: ArkMetadata;

    public getMetadata(kind: ArkMetadataKind): ArkMetadataType | undefined {
        return this.metadata?.getMetadata(kind);
    }

    public setMetadata(kind: ArkMetadataKind, value: ArkMetadataType): void {
        if (!this.metadata) {
            this.metadata = new ArkMetadata();
        }
        return this.metadata?.setMetadata(kind, value);
    }

    public getModifiers(): number {
        if (!this.modifiers) {
            return 0;
        }
        return this.modifiers;
    }

    public setModifiers(modifiers: number): void {
        if (modifiers !== 0) {
            this.modifiers = modifiers;
        }
    }

    public addModifier(modifier: ModifierType | number): void {
        this.modifiers = this.getModifiers() | modifier;
    }

    public removeModifier(modifier: ModifierType): void {
        if (!this.modifiers) {
            return;
        }
        this.modifiers &= MODIFIER_TYPE_MASK ^ modifier;
    }

    public isStatic(): boolean {
        return this.containsModifier(ModifierType.STATIC);
    }

    public isProtected(): boolean {
        return this.containsModifier(ModifierType.PROTECTED);
    }

    public isPrivate(): boolean {
        return this.containsModifier(ModifierType.PRIVATE);
    }

    public isPublic(): boolean {
        return this.containsModifier(ModifierType.PUBLIC);
    }

    public isReadonly(): boolean {
        return this.containsModifier(ModifierType.READONLY);
    }

    public isAbstract(): boolean {
        return this.containsModifier(ModifierType.ABSTRACT);
    }

    public isExport(): boolean {
        return this.containsModifier(ModifierType.EXPORT);
    }

    public isDefault(): boolean {
        return this.containsModifier(ModifierType.DEFAULT);
    }

    public isPureVirtual(): boolean {
        return this.containsModifier(ModifierType.PURE_VIRTUAL);
    }

    /** @deprecated Use {@link isExport} instead. */
    public isExported(): boolean {
        return this.isExport();
    }

    public isDeclare(): boolean {
        return this.containsModifier(ModifierType.DECLARE);
    }

    public containsModifier(modifierType: ModifierType): boolean {
        if (!this.modifiers) {
            return false;
        }

        return (this.modifiers & modifierType) === modifierType;
    }

    public getDecorators(): Decorator[] {
        if (this.decorators) {
            return Array.from(this.decorators);
        }
        return [];
    }

    public setDecorators(decorators: Set<Decorator>): void {
        if (decorators.size > 0) {
            this.decorators = decorators;
        }
    }

    public addDecorator(decorator: Decorator): void {
        if (!this.decorators) {
            this.decorators = new Set();
        }
        this.decorators.add(decorator);
    }

    public removeDecorator(kind: string): void {
        this.decorators?.forEach(value => {
            if (value.getKind() === kind) {
                this.decorators?.delete(value);
            }
        });
    }

    public hasBuilderDecorator(): boolean {
        return this.hasDecorator(BUILDER_DECORATOR);
    }

    public getStateDecorators(): Decorator[] {
        if (!this.decorators) {
            return [];
        }
        return Array.from(this.decorators).filter(item => {
            return COMPONENT_MEMBER_DECORATORS.has(item.getKind());
        }) as Decorator[];
    }

    public hasBuilderParamDecorator(): boolean {
        return this.hasDecorator(BUILDER_PARAM_DECORATOR);
    }

    public hasEntryDecorator(): boolean {
        return this.hasDecorator(ENTRY_DECORATOR);
    }

    public hasComponentDecorator(): boolean {
        return this.hasDecorator(COMPONENT_DECORATOR);
    }

    public hasDecorator(kind: string | Set<string>): boolean {
        let decorators = this.getDecorators();
        return (
            decorators.filter(value => {
                if (kind instanceof Set) {
                    return kind.has(value.getKind());
                }
                return value.getKind() === kind;
            }).length !== 0
        );
    }

    protected validateFields(fields: string[]): ArkError {
        let errs: string[] = [];
        for (const field of fields) {
            let value = Reflect.get(this, field);
            if (!value) {
                errs.push(field);
            }
        }
        if (errs.length === 0) {
            return { errCode: ArkErrorCode.OK };
        }
        logger.error(`class fields: ${errs.join(',')} is undefined.`);
        return {
            errCode: ArkErrorCode.CLASS_INSTANCE_FIELD_UNDEFINDED,
            errMsg: `${errs.join(',')} is undefined.`,
        };
    }

    public abstract validate(): ArkError;
}
