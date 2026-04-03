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
    TYPE = 1 << 15,
    LAZY = 1 << 16,
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
    [ts.SyntaxKind.TypeKeyword, ModifierType.TYPE],
    [ts.SyntaxKind.LazyKeyword, ModifierType.LAZY],
]);

export function modifierKind2Enum(kind: ts.SyntaxKind): ModifierType {
    return MODIFIER_KIND_2_ENUM.get(kind)!;
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
            errCode: ArkErrorCode.CLASS_INSTANCE_FIELD_UNDEFINED,
            errMsg: `${errs.join(',')} is undefined.`,
        };
    }

    public abstract validate(): ArkError;
}
