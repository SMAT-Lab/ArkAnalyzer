/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { ByteBuffer } from 'flatbuffers';
import * as flatbuffers from 'flatbuffers';

import type {
    classBase,
    CxxAliasInfo,
    CxxAstNode,
    CxxCtorAnyInit,
    CxxEnclosingFunction,
    CxxIncludeInfo,
    CxxPosition,
    CxxRange,
    CxxReferencedDecl,
    CxxTypeInfo,
    defaultArg,
    DtorType,
    NominatedNamespace,
    SpellingLoc,
} from '../ArkCxxAstNode';
import type { ClassBaseWire } from './flatGenerated/ark-cxx-ast-fb/class-base-wire';
import type { CxxAliasInfoWire } from './flatGenerated/ark-cxx-ast-fb/cxx-alias-info-wire';
import type { CxxAstNodeWire } from './flatGenerated/ark-cxx-ast-fb/cxx-ast-node-wire';
import type { CxxCtorAnyInitWire } from './flatGenerated/ark-cxx-ast-fb/cxx-ctor-any-init-wire';
import type { CxxEnclosingFunctionWire } from './flatGenerated/ark-cxx-ast-fb/cxx-enclosing-function-wire';
import type { CxxIncludeInfoWire } from './flatGenerated/ark-cxx-ast-fb/cxx-include-info-wire';
import type { CxxLocWire } from './flatGenerated/ark-cxx-ast-fb/cxx-loc-wire';
import type { CxxNominatedNamespaceWire } from './flatGenerated/ark-cxx-ast-fb/cxx-nominated-namespace-wire';
import type { CxxPositionWire } from './flatGenerated/ark-cxx-ast-fb/cxx-position-wire';
import type { CxxRangeWire } from './flatGenerated/ark-cxx-ast-fb/cxx-range-wire';
import type { CxxReferencedDeclWire } from './flatGenerated/ark-cxx-ast-fb/cxx-referenced-decl-wire';
import type { CxxTypeInfoWire } from './flatGenerated/ark-cxx-ast-fb/cxx-type-info-wire';
import type { DefaultArgWire } from './flatGenerated/ark-cxx-ast-fb/default-arg-wire';
import type { DtorTypeWire } from './flatGenerated/ark-cxx-ast-fb/dtor-type-wire';
import { CxxAstPayload } from './flatGenerated/ark-cxx-ast-fb/cxx-ast-payload';

type WireTable = { bb: flatbuffers.ByteBuffer | null; bb_pos: number };

function hasWireSlot(w: WireTable, vtableSlot: number): boolean {
    return !!w.bb && w.bb.__offset(w.bb_pos, vtableSlot) !== 0;
}

function assignStr<T extends object, K extends keyof T>(target: T, key: K, value: string | null): void {
    if (value !== null && value !== undefined) {
        target[key] = value as T[K];
    }
}

function wirePosition(w: CxxPositionWire | null): CxxPosition | undefined {
    if (!w) {
        return undefined;
    }
    const pos: Partial<CxxPosition> = {};
    if (hasWireSlot(w, 4)) {
        pos.line = w.line();
    }
    if (hasWireSlot(w, 6)) {
        pos.col = w.col();
    }
    if (hasWireSlot(w, 8) && w.offset()) {
        pos.offset = w.offset();
    }
    if (hasWireSlot(w, 10) && w.tokLen()) {
        pos.tokLen = w.tokLen();
    }
    if (pos.line === undefined && pos.col === undefined && pos.offset === undefined && pos.tokLen === undefined) {
        return undefined;
    }
    return pos as CxxPosition;
}

function wireSpellingLoc(w: CxxPositionWire | null): SpellingLoc | undefined {
    if (!w) {
        return undefined;
    }
    const loc: SpellingLoc = { line: w.line(), col: w.col() };
    assignStr(loc, 'file', w.file());
    if (w.offset()) {
        loc.offset = w.offset();
    }
    if (w.tokLen()) {
        loc.tokLen = w.tokLen();
    }
    return loc;
}

function wireRange(w: CxxRangeWire | null): CxxRange | undefined {
    if (!w) {
        return undefined;
    }
    const beginWire = w.begin();
    const endWire = w.end();
    const begin = beginWire ? (wirePosition(beginWire) ?? ({} as CxxPosition)) : undefined;
    const end = endWire ? (wirePosition(endWire) ?? ({} as CxxPosition)) : undefined;
    if (!begin && !end && !w.spellingLoc() && !w.expansionLoc()) {
        return undefined;
    }
    const range: CxxRange = {
        begin: begin ?? ({} as CxxPosition),
        end: end ?? ({} as CxxPosition),
    };
    const spelling = wireSpellingLoc(w.spellingLoc());
    if (spelling) {
        range.spellingLoc = spelling;
    }
    const expansion = wirePosition(w.expansionLoc());
    if (expansion) {
        range.expansionLoc = expansion;
    }
    return range;
}

function wireTypeInfo(w: CxxTypeInfoWire | null): CxxTypeInfo | undefined {
    if (!w) {
        return undefined;
    }
    const type: CxxTypeInfo = { qualType: w.qualType() ?? '' };
    assignStr(type, 'type', w.type());
    assignStr(type, 'desugaredQualType', w.desugaredQualType());
    const aliasId = w.typeAliasDeclId();
    if (aliasId !== BigInt(0)) {
        type.typeAliasDeclId = Number(aliasId);
    }
    assignStr(type, 'typeAliasDeclQualifiedName', w.typeAliasDeclQualifiedName());
    return type;
}

function wireAliasInfo(w: CxxAliasInfoWire | null): CxxAliasInfo | undefined {
    if (!w) {
        return undefined;
    }
    const alias: CxxAliasInfo = {};
    assignStr(alias, 'declCode', w.declCode());
    const range = wireRange(w.range());
    if (range) {
        alias.range = range;
    }
    return alias;
}

function wireReferencedDecl(w: CxxReferencedDeclWire | null): CxxReferencedDecl | undefined {
    if (!w) {
        return undefined;
    }
    const ref: CxxReferencedDecl = {};
    assignStr(ref, 'kind', w.kind());
    assignStr(ref, 'name', w.name());
    if (w.type()) {
        const type = wireTypeInfo(w.type());
        if (type) {
            ref.type = type;
        }
    }
    const alias = wireAliasInfo(w.alias());
    if (alias) {
        ref.alias = alias;
    }
    return ref;
}

function wireAnyInit(w: CxxCtorAnyInitWire | null): CxxCtorAnyInit | undefined {
    if (!w) {
        return undefined;
    }
    const init: CxxCtorAnyInit = { kind: (w.kind() as 'FieldDecl') ?? 'FieldDecl', name: w.name() ?? '' };
    const initType = w.type() ? wireTypeInfo(w.type()) : undefined;
    if (initType) {
        init.type = initType;
    }
    return init;
}

function wireEnclosingFunction(w: CxxEnclosingFunctionWire | null): CxxEnclosingFunction | undefined {
    if (!w) {
        return undefined;
    }
    const fn: CxxEnclosingFunction = {};
    const id = w.id();
    if (id !== BigInt(0)) {
        fn.id = Number(id);
    }
    assignStr(fn, 'kind', w.kind());
    assignStr(fn, 'name', w.name());
    const range = wireRange(w.range());
    if (range) {
        fn.range = range;
    }
    return fn;
}

function wireNominatedNamespace(w: CxxNominatedNamespaceWire | null): NominatedNamespace | undefined {
    if (!w) {
        return undefined;
    }
    const idRaw = w.id();
    return {
        id: (idRaw ?? '') as unknown as NominatedNamespace['id'],
        kind: w.kind() ?? '',
        name: w.name() ?? '',
    };
}

function wireDtor(w: DtorTypeWire | null): DtorType | undefined {
    if (!w) {
        return undefined;
    }
    const dtor: DtorType = {};
    const id = w.id();
    if (id !== BigInt(0)) {
        dtor.id = Number(id);
    }
    assignStr(dtor, 'kind', w.kind());
    assignStr(dtor, 'name', w.name());
    if (w.type()) {
        const type = wireTypeInfo(w.type());
        if (type) {
            dtor.type = type;
        }
    }
    return dtor;
}

function wireIncludeInfo(w: CxxIncludeInfoWire | null): CxxIncludeInfo | undefined {
    if (!w) {
        return undefined;
    }
    const loc = wireSpellingLoc(w.loc());
    if (!loc) {
        return undefined;
    }
    return {
        code: w.code() ?? '',
        includeName: w.includeName() ?? '',
        includedFrom: w.includedFrom() ?? '',
        isAngled: w.isAngled(),
        kind: w.kind() ?? '',
        loc,
        relativePath: w.relativePath() ?? '',
        searchPath: w.searchPath() ?? '',
        ...(w.fileName() ? { fileName: w.fileName()! } : {}),
    };
}

function wireLoc(w: CxxLocWire | null): CxxAstNode['loc'] | undefined {
    if (!w) {
        return undefined;
    }
    const loc: NonNullable<CxxAstNode['loc']> & { offset?: number; tokLen?: number } = {};
    assignStr(loc, 'file', w.file());
    if (hasWireSlot(w, 6)) {
        loc.line = w.line();
    }
    if (hasWireSlot(w, 8)) {
        loc.col = w.col();
    }
    if (hasWireSlot(w, 10) && w.offset()) {
        loc.offset = w.offset();
    }
    if (hasWireSlot(w, 12) && w.tokLen()) {
        loc.tokLen = w.tokLen();
    }
    const spelling = wireSpellingLoc(w.spellingLoc());
    if (spelling) {
        loc.spellingLoc = spelling;
    }
    const expansion = wirePosition(w.expansionLoc());
    if (expansion) {
        loc.expansionLoc = expansion;
    }
    return loc;
}

function synthesizeLocFromRange(node: CxxAstNode): void {
    if (node.loc || !node.range?.begin) {
        return;
    }
    const begin = node.range.begin;
    node.loc = {
        line: begin.line,
        col: begin.col,
    };
    if (node.range.spellingLoc) {
        node.loc.spellingLoc = node.range.spellingLoc;
    }
    if (node.range.expansionLoc) {
        node.loc.expansionLoc = node.range.expansionLoc;
    }
}

function wireDefaultArg(w: DefaultArgWire | null): defaultArg | undefined {
    if (!w) {
        return undefined;
    }
    const type = w.type() ? wireTypeInfo(w.type()) : undefined;
    const arg: defaultArg = { kind: w.kind() ?? '', type: type ?? { qualType: '' } };
    return arg;
}

function wireClassBase(w: ClassBaseWire | null): classBase | undefined {
    if (!w) {
        return undefined;
    }
    const type = w.type() ? wireTypeInfo(w.type()) : undefined;
    const base: classBase = { access: w.access() ?? '', type: type ?? { qualType: '' } };
    if (w.isVirtual()) {
        base.isVirtual = true;
    }
    assignStr(base, 'writtenAccess', w.writtenAccess());
    return base;
}

function readWireStringList(length: number, at: (index: number) => string | null): string[] | undefined {
    if (length <= 0) {
        return undefined;
    }
    const values: string[] = [];
    for (let i = 0; i < length; i++) {
        const item = at(i);
        if (item !== null) {
            values.push(item);
        }
    }
    return values.length > 0 ? values : undefined;
}

function assignWireCoreFields(node: CxxAstNode, w: CxxAstNodeWire): void {
    const kind = w.kind();
    if (kind) {
        node.kind = kind;
    }
    assignStr(node, 'name', w.name());
    assignStr(node, 'code', w.code());
    if (w.type()) {
        const type = wireTypeInfo(w.type());
        if (type) {
            node.type = type;
        }
    }
}

function assignWireMetadataFields(node: CxxAstNode, w: CxxAstNodeWire): void {
    assignStr(node, 'id', w.id());
    assignStr(node, 'originalId', w.originalId());
    if (w.hasInClassInitializer()) {
        node.hasInClassInitializer = true;
    }
    assignStr(node, 'mangledName', w.mangledName());
    assignStr(node, 'tagUsed', w.tagUsed());
    if (w.isImplicit()) {
        node.isImplicit = true;
    }
    assignStr(node, 'storageClass', w.storageClass());
    assignStr(node, 'access', w.access());
    const ref = wireReferencedDecl(w.referencedDecl());
    if (ref) {
        node.referencedDecl = ref;
    }
}

function assignWireExprFields(node: CxxAstNode, w: CxxAstNodeWire): void {
    assignStr(node, 'value', w.value());
    assignStr(node, 'valueCategory', w.valueCategory());
    assignStr(node, 'castKind', w.castKind());
    assignStr(node, 'opcode', w.opcode());
    assignStr(node, 'op', w.op());
    if (w.isPostfix()) {
        node.isPostfix = true;
    }
    if (w.isArrow()) {
        node.isArrow = true;
    }
    if (w.isArray()) {
        node.isArray = true;
    }
    assignStr(node, 'traitFunc', w.traitFunc());
    assignStr(node, 'traitArgs', w.traitArgs());
    assignStr(node, 'noexceptArg', w.noexceptArg());
    if (w.typeArg()) {
        node.typeArg = wireTypeInfo(w.typeArg());
    }
    assignStr(node, 'atomicFunc', w.atomicFunc());
    assignStr(node, 'pseudoDestructorType', w.pseudoDestructorType());
    if (w.targetLabelId()) {
        node.targetLabelId = w.targetLabelId();
    }
}

function assignWireDeclContextFields(node: CxxAstNode, w: CxxAstNodeWire): void {
    const anyInit = wireAnyInit(w.anyInit());
    if (anyInit) {
        node.anyInit = anyInit;
    }
    if (w.baseInit()) {
        node.baseInit = wireTypeInfo(w.baseInit());
    }
    const ns = wireNominatedNamespace(w.nominatedNamespace());
    if (ns) {
        node.nominatedNamespace = ns;
    }
    const loc = wireLoc(w.loc());
    if (loc) {
        node.loc = loc;
    }
    const range = wireRange(w.range());
    if (range) {
        node.range = range;
    }
    synthesizeLocFromRange(node);
    const enc = wireEnclosingFunction(w.enclosingFunction());
    if (enc) {
        node.enclosingFunction = enc;
    }
    const defArg = wireDefaultArg(w.defaultArg());
    if (defArg) {
        node.defaultArg = defArg;
    }
    const dtor = wireDtor(w.dtor());
    if (dtor) {
        node.dtor = dtor;
    }
    const defaultVal = w.default_();
    if (defaultVal !== null) {
        node.default = defaultVal;
    }
}

function assignWireCollectionFields(node: CxxAstNode, w: CxxAstNodeWire): void {
    const arraySizes = readWireStringList(w.arraySizesLength(), (i) => w.arraySizes(i));
    if (arraySizes) {
        node.arraySizes = arraySizes;
    }
    const typeArguments = readWireStringList(w.typeArgumentsLength(), (i) => w.typeArguments(i));
    if (typeArguments) {
        node.typeArguments = typeArguments;
    }
    const includesLen = w.includesLength();
    if (includesLen > 0) {
        node.includes = [];
        for (let i = 0; i < includesLen; i++) {
            const inc = wireIncludeInfo(w.includes(i));
            if (inc) {
                node.includes.push(inc);
            }
        }
    }
    const basesLen = w.basesLength();
    if (basesLen > 0) {
        node.bases = [];
        for (let i = 0; i < basesLen; i++) {
            const base = wireClassBase(w.bases(i));
            if (base) {
                node.bases.push(base);
            }
        }
    }
}

function assignWireChildFields(node: CxxAstNode, w: CxxAstNodeWire): void {
    const innerLen = w.innerLength();
    for (let i = 0; i < innerLen; i++) {
        const ch = w.inner(i);
        if (ch) {
            node.inner.push(decodeWireNode(ch));
        }
    }
    const huLen = w.headerUnitsLength();
    if (huLen > 0) {
        node.headerUnits = [];
        for (let i = 0; i < huLen; i++) {
            const hu = w.headerUnits(i);
            if (hu) {
                node.headerUnits.push(decodeWireNode(hu));
            }
        }
    }
}

/** Structured wire columns → {@link CxxAstNode}. */
export function structuredNodeFromWire(w: CxxAstNodeWire): CxxAstNode {
    const node = {
        inner: [] as CxxAstNode[],
    } as CxxAstNode;
    assignWireCoreFields(node, w);
    assignWireMetadataFields(node, w);
    assignWireExprFields(node, w);
    assignWireDeclContextFields(node, w);
    assignWireCollectionFields(node, w);
    assignWireChildFields(node, w);
    return node;
}

/** Decode FlatBuffers wire columns into {@link CxxAstNode}. */
export function decodeWireNode(w: CxxAstNodeWire): CxxAstNode {
    return structuredNodeFromWire(w);
}

/** Decodes FlatBuffers {@link CxxAstPayload} into {@link CxxAstNode}. */
export class CxxAstDecoder {
    public static decode(payload: Buffer): CxxAstNode {
        if (!payload || payload.length === 0) {
            throw new Error('empty flat payload');
        }
        const bb = new ByteBuffer(new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength));
        const root = CxxAstPayload.getRootAsCxxAstPayload(bb);
        const wire = root.root();
        if (!wire) {
            throw new Error('missing root node in flat payload');
        }
        return decodeWireNode(wire);
    }
}
