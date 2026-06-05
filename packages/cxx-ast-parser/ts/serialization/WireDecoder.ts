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
    ClassBase,
    CxxAstNode,
    CxxCtorAnyInit,
    CxxIncludeInfo,
    CxxPosition,
    CxxRange,
    CxxReferencedDecl,
    CxxTypeInfo,
} from '../../lib/utils/ArkCxxAstNode';
import { CxxAccess } from '../../lib/utils/ArkCxxAstNode';
import {
    wireAccessToEnum,
    wireFoldOpToEnum,
    wireKindToAstKind,
    wireOpcodeToEnum,
    wireStorageClassToEnum,
    wireTagUsedToEnum,
    wireValueCategoryToEnum,
} from '../astUtils';
import type { ClassBaseWire } from './flatGenerated/ark-cxx-ast-fb/class-base-wire';
import type { CxxAstNodeWire } from './flatGenerated/ark-cxx-ast-fb/cxx-ast-node-wire';
import type { CxxAstPayload } from './flatGenerated/ark-cxx-ast-fb/cxx-ast-payload';
import type { CxxCtorAnyInitWire } from './flatGenerated/ark-cxx-ast-fb/cxx-ctor-any-init-wire';
import type { CxxIncludeInfoWire } from './flatGenerated/ark-cxx-ast-fb/cxx-include-info-wire';
import type { CxxLocWire } from './flatGenerated/ark-cxx-ast-fb/cxx-loc-wire';
import type { CxxPositionWire } from './flatGenerated/ark-cxx-ast-fb/cxx-position-wire';
import type { CxxRangeWire } from './flatGenerated/ark-cxx-ast-fb/cxx-range-wire';
import type { CxxReferencedDeclWire } from './flatGenerated/ark-cxx-ast-fb/cxx-referenced-decl-wire';
import type { CxxTypeInfoWire } from './flatGenerated/ark-cxx-ast-fb/cxx-type-info-wire';
import { CxxAstPayload as CxxAstPayloadClass } from './flatGenerated/ark-cxx-ast-fb/cxx-ast-payload';

type WireTable = { bb: flatbuffers.ByteBuffer | null; bb_pos: number };
export type WireStringPool = readonly string[];

function hasWireSlot(w: WireTable, vtableSlot: number): boolean {
    return !!w.bb && w.bb.__offset(w.bb_pos, vtableSlot) !== 0;
}

function resolveStr(pool: WireStringPool, id: number): string | null {
    if (id === 0) {
        return null;
    }
    return pool[id - 1] ?? null;
}

export function loadStringPool(payload: CxxAstPayload): WireStringPool {
    const len = payload.stringPoolLength();
    const pool: string[] = [];
    for (let i = 0; i < len; i++) {
        pool.push(payload.stringPool(i) ?? '');
    }
    return pool;
}

function assignStr<T extends object, K extends keyof T>(target: T, key: K, value: string | null): void {
    if (value !== null && value !== undefined) {
        target[key] = value as T[K];
    }
}

function assignWireUint8<T extends object, K extends keyof T, E extends number>(
    target: T,
    key: K,
    w: WireTable,
    vtableSlot: number,
    read: () => number,
    toEnum: (id: number) => E
): void {
    if (!hasWireSlot(w, vtableSlot)) {
        return;
    }
    const id = read();
    if (id !== 0) {
        target[key] = toEnum(id) as T[K];
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

function wireRange(w: CxxRangeWire | null): CxxRange | undefined {
    if (!w) {
        return undefined;
    }
    const beginWire = w.begin();
    const endWire = w.end();
    const begin = beginWire ? (wirePosition(beginWire) ?? ({} as CxxPosition)) : undefined;
    const end = endWire ? (wirePosition(endWire) ?? ({} as CxxPosition)) : undefined;
    if (!begin && !end) {
        return undefined;
    }
    const range: CxxRange = {
        begin: begin ?? ({} as CxxPosition),
        end: end ?? ({} as CxxPosition),
    };
    return range;
}

function wireTypeInfo(w: CxxTypeInfoWire | null, pool: WireStringPool): CxxTypeInfo | undefined {
    if (!w) {
        return undefined;
    }
    const type: CxxTypeInfo = { qualType: resolveStr(pool, w.qualType()) ?? '' };
    assignStr(type, 'desugaredQualType', resolveStr(pool, w.desugaredQualType()));
    const aliasId = w.typeAliasDeclId();
    if (aliasId !== BigInt(0)) {
        type.typeAliasDeclId = Number(aliasId);
    }
    return type;
}

function wireReferencedDecl(w: CxxReferencedDeclWire | null, pool: WireStringPool): CxxReferencedDecl | undefined {
    if (!w) {
        return undefined;
    }
    const ref: CxxReferencedDecl = {};
    ref.kind = wireKindToAstKind(w.kind());
    assignStr(ref, 'name', resolveStr(pool, w.name()));
    if (w.type()) {
        const type = wireTypeInfo(w.type(), pool);
        if (type) {
            ref.type = type;
        }
    }
    return ref;
}

function wireAnyInit(w: CxxCtorAnyInitWire | null, pool: WireStringPool): CxxCtorAnyInit | undefined {
    if (!w) {
        return undefined;
    }
    const init: CxxCtorAnyInit = { name: resolveStr(pool, w.name()) ?? '' };
    const initType = w.type() ? wireTypeInfo(w.type(), pool) : undefined;
    if (initType) {
        init.type = initType;
    }
    return init;
}

function wireIncludeInfo(w: CxxIncludeInfoWire | null, pool: WireStringPool): CxxIncludeInfo | undefined {
    if (!w) {
        return undefined;
    }
    const loc = wirePosition(w.loc());
    if (!loc) {
        return undefined;
    }
    return {
        includeName: resolveStr(pool, w.includeName()) ?? '',
        kind: wireKindToAstKind(w.kind()),
        loc,
        ...(resolveStr(pool, w.fileName()) ? { fileName: resolveStr(pool, w.fileName())! } : {}),
    };
}

function wireLoc(w: CxxLocWire | null, pool: WireStringPool): CxxAstNode['loc'] | undefined {
    if (!w) {
        return undefined;
    }
    const loc: NonNullable<CxxAstNode['loc']> = {};
    assignStr(loc, 'file', resolveStr(pool, w.file()));
    if (hasWireSlot(w, 6)) {
        loc.line = w.line();
    }
    if (hasWireSlot(w, 8)) {
        loc.col = w.col();
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
}

const VT_CLASS_BASE_ACCESS = 4;

function wireClassBase(w: ClassBaseWire | null, pool: WireStringPool): ClassBase | undefined {
    if (!w) {
        return undefined;
    }
    const type = w.type() ? wireTypeInfo(w.type(), pool) : undefined;
    const access = hasWireSlot(w, VT_CLASS_BASE_ACCESS) ? wireAccessToEnum(w.access()) : CxxAccess.Unknown;
    const base: ClassBase = { access, type: type ?? { qualType: '' } };
    const baseFlags = w.baseFlags();
    if (baseFlags !== 0) {
        base.baseFlags = baseFlags;
    }
    return base;
}

function assignWireNodeFlags(node: CxxAstNode, w: CxxAstNodeWire): void {
    if (!hasWireSlot(w, VT_NODE_FLAGS)) {
        return;
    }
    const flags = w.nodeFlags();
    if (flags !== 0) {
        node.nodeFlags = flags;
    }
}

function assignWireModifierFlags(node: CxxAstNode, w: CxxAstNodeWire): void {
    if (!hasWireSlot(w, VT_MODIFIER_FLAGS)) {
        return;
    }
    const flags = w.modifierFlags() >>> 0;
    if (flags !== 0) {
        node.modifierFlags = flags;
    }
}

function assignWireCoreFields(node: CxxAstNode, w: CxxAstNodeWire, pool: WireStringPool): void {
    node.kind = wireKindToAstKind(w.kind());
    assignWireNodeFlags(node, w);
    assignStr(node, 'name', resolveStr(pool, w.name()));
    assignWireModifierFlags(node, w);
    if (w.type()) {
        const type = wireTypeInfo(w.type(), pool);
        if (type) {
            node.type = type;
        }
    }
}

function assignWireMetadataFields(node: CxxAstNode, w: CxxAstNodeWire, pool: WireStringPool): void {
    assignStr(node, 'id', resolveStr(pool, w.id()));
    assignStr(node, 'originalId', resolveStr(pool, w.originalId()));
    assignStr(node, 'mangledName', resolveStr(pool, w.mangledName()));
    assignWireUint8(node, 'tagUsed', w, VT_TAG_USED, () => w.tagUsed(), wireTagUsedToEnum);
    assignWireUint8(node, 'storageClass', w, VT_STORAGE_CLASS, () => w.storageClass(), wireStorageClassToEnum);
    assignWireUint8(node, 'access', w, VT_ACCESS, () => w.access(), wireAccessToEnum);
    const ref = wireReferencedDecl(w.referencedDecl(), pool);
    if (ref) {
        node.referencedDecl = ref;
    }
}

const VT_NODE_FLAGS = 10;
const VT_MODIFIER_FLAGS = 14;
const VT_TAG_USED = 20;
const VT_STORAGE_CLASS = 22;
const VT_ACCESS = 24;
const VT_VALUE_CATEGORY = 30;
const VT_CAST_KIND = 32;
const VT_OPCODE = 34;
const VT_OP = 36;

function assignWireExprFields(node: CxxAstNode, w: CxxAstNodeWire, pool: WireStringPool): void {
    assignStr(node, 'value', resolveStr(pool, w.value()));
    assignWireUint8(node, 'valueCategory', w, VT_VALUE_CATEGORY, () => w.valueCategory(), wireValueCategoryToEnum);
    if (hasWireSlot(w, VT_CAST_KIND)) {
        node.castKind = wireKindToAstKind(w.castKind());
    }
    assignWireUint8(node, 'opcode', w, VT_OPCODE, () => w.opcode(), wireOpcodeToEnum);
    assignWireUint8(node, 'op', w, VT_OP, () => w.op(), wireFoldOpToEnum);
    if (w.typeArg()) {
        node.typeArg = wireTypeInfo(w.typeArg(), pool);
    }
}

function assignWireDeclContextFields(node: CxxAstNode, w: CxxAstNodeWire, pool: WireStringPool): void {
    const anyInit = wireAnyInit(w.anyInit(), pool);
    if (anyInit) {
        node.anyInit = anyInit;
    }
    if (w.baseInit()) {
        node.baseInit = wireTypeInfo(w.baseInit(), pool);
    }
    assignStr(node, 'nominatedNamespace', resolveStr(pool, w.nominatedNamespace()));
    const loc = wireLoc(w.loc(), pool);
    if (loc) {
        node.loc = loc;
    }
    const range = wireRange(w.range());
    if (range) {
        node.range = range;
    }
    synthesizeLocFromRange(node);
    if (w.defaultArg()) {
        const defArg = wireTypeInfo(w.defaultArg(), pool);
        if (defArg) {
            node.defaultArg = defArg;
        }
    }
    const dtorId = w.dtor();
    if (dtorId !== 0) {
        node.dtor = wireKindToAstKind(dtorId);
    }
}

function assignWireCollectionFields(node: CxxAstNode, w: CxxAstNodeWire, pool: WireStringPool): void {
    const includesLen = w.includesLength();
    if (includesLen > 0) {
        node.includes = [];
        for (let i = 0; i < includesLen; i++) {
            const inc = wireIncludeInfo(w.includes(i), pool);
            if (inc) {
                node.includes.push(inc);
            }
        }
    }
    const basesLen = w.basesLength();
    if (basesLen > 0) {
        node.bases = [];
        for (let i = 0; i < basesLen; i++) {
            const base = wireClassBase(w.bases(i), pool);
            if (base) {
                node.bases.push(base);
            }
        }
    }
}

function assignWireChildFields(node: CxxAstNode, w: CxxAstNodeWire, pool: WireStringPool): void {
    const innerLen = w.innerLength();
    for (let i = 0; i < innerLen; i++) {
        const ch = w.inner(i);
        if (ch) {
            node.inner.push(decodeWireNode(ch, pool));
        }
    }
    const huLen = w.headerUnitsLength();
    if (huLen > 0) {
        node.headerUnits = [];
        for (let i = 0; i < huLen; i++) {
            const hu = w.headerUnits(i);
            if (hu) {
                node.headerUnits.push(decodeWireNode(hu, pool));
            }
        }
    }
}

/** Structured wire columns → {@link CxxAstNode}. */
export function structuredNodeFromWire(w: CxxAstNodeWire, pool: WireStringPool): CxxAstNode {
    const node = {
        inner: [] as CxxAstNode[],
    } as CxxAstNode;
    assignWireCoreFields(node, w, pool);
    assignWireMetadataFields(node, w, pool);
    assignWireExprFields(node, w, pool);
    assignWireDeclContextFields(node, w, pool);
    assignWireCollectionFields(node, w, pool);
    assignWireChildFields(node, w, pool);
    return node;
}

/** Decode FlatBuffers wire columns into {@link CxxAstNode}. */
export function decodeWireNode(w: CxxAstNodeWire, pool: WireStringPool): CxxAstNode {
    return structuredNodeFromWire(w, pool);
}

/** Decodes FlatBuffers {@link CxxAstPayload} into {@link CxxAstNode}. */
export class CxxAstDecoder {
    public static decode(payload: Buffer): CxxAstNode {
        if (!payload || payload.length === 0) {
            throw new Error('empty flat payload');
        }
        const bb = new ByteBuffer(new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength));
        const root = CxxAstPayloadClass.getRootAsCxxAstPayload(bb);
        const pool = loadStringPool(root);
        const wire = root.root();
        if (!wire) {
            throw new Error('missing root node in flat payload');
        }
        return decodeWireNode(wire, pool);
    }
}
