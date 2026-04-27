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

import { describe, expect, it } from 'vitest';
import {
    ArkAssignStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    BasicBlock,
    Local,
} from '../../../../src';
import { ArkErrorCode } from '../../../../src/core/common/ArkError';
import { NumberConstant } from '../../../../src/core/base/Constant';

describe('BasicBlock id and stmt operations', () => {
    it('default id is -1, can be set via constructor or setId', () => {
        expect(new BasicBlock().getId()).toBe(-1);
        expect(new BasicBlock(5).getId()).toBe(5);

        const bb = new BasicBlock();
        bb.setId(42);
        expect(bb.getId()).toBe(42);
    });

    it('starts with an empty stmts list', () => {
        const bb = new BasicBlock();
        expect(bb.getStmts()).toEqual([]);
    });

    it('addStmt appends to the tail', () => {
        const bb = new BasicBlock();
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        bb.addStmt(s1);
        bb.addStmt(s2);
        expect(bb.getStmts()).toEqual([s1, s2]);
    });

    it('addHead prepends a single stmt or an array of stmts', () => {
        const bb = new BasicBlock();
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const s3 = new ArkReturnVoidStmt();
        const s4 = new ArkReturnVoidStmt();

        bb.addStmt(s1);
        bb.addHead(s2);
        bb.addHead([s3, s4]);
        expect(bb.getStmts()).toEqual([s3, s4, s2, s1]);
    });

    it('addTail appends a single stmt or an array of stmts', () => {
        const bb = new BasicBlock();
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const s3 = new ArkReturnVoidStmt();

        bb.addTail(s1);
        bb.addTail([s2, s3]);
        expect(bb.getStmts()).toEqual([s1, s2, s3]);
    });
});

describe('BasicBlock insertBefore / insertAfter', () => {
    it('insertAfter inserts after a known stmt and returns the inserted count', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        const c = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmt(b);

        const n = bb.insertAfter(c, a);
        expect(n).toBe(1);
        expect(bb.getStmts()).toEqual([a, c, b]);
    });

    it('insertAfter accepts an array and returns its length', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        const ins1 = new ArkReturnVoidStmt();
        const ins2 = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmt(b);

        const n = bb.insertAfter([ins1, ins2], a);
        expect(n).toBe(2);
        expect(bb.getStmts()).toEqual([a, ins1, ins2, b]);
    });

    it('insertAfter returns 0 when point is not found', () => {
        const bb = new BasicBlock();
        bb.addStmt(new ArkReturnVoidStmt());
        const orphan = new ArkReturnVoidStmt();
        const ins = new ArkReturnVoidStmt();
        const n = bb.insertAfter(ins, orphan);
        expect(n).toBe(0);
        expect(bb.getStmts()).toHaveLength(1);
    });

    it('insertBefore inserts before a known stmt', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        const ins = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmt(b);

        const n = bb.insertBefore(ins, b);
        expect(n).toBe(1);
        expect(bb.getStmts()).toEqual([a, ins, b]);
    });

    it('insertBefore returns 0 when point is not found', () => {
        const bb = new BasicBlock();
        bb.addStmt(new ArkReturnVoidStmt());
        const n = bb.insertBefore(new ArkReturnVoidStmt(), new ArkReturnVoidStmt());
        expect(n).toBe(0);
    });
});

describe('BasicBlock remove operations', () => {
    it('remove drops the matching stmt', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        const c = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmt(b);
        bb.addStmt(c);

        bb.remove(b);
        expect(bb.getStmts()).toEqual([a, c]);
    });

    it('remove is a no-op for unknown stmts', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.remove(new ArkReturnVoidStmt());
        expect(bb.getStmts()).toEqual([a]);
    });

    it('removeHead/removeTail drop the boundary stmt', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        const c = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmt(b);
        bb.addStmt(c);

        bb.removeHead();
        expect(bb.getStmts()).toEqual([b, c]);

        bb.removeTail();
        expect(bb.getStmts()).toEqual([b]);
    });
});

describe('BasicBlock getHead / getTail', () => {
    it('returns first/last stmt of the block', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        const c = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmt(b);
        bb.addStmt(c);

        expect(bb.getHead()).toBe(a);
        expect(bb.getTail()).toBe(c);
    });

    it('returns the single stmt when only one is present', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        bb.addStmt(a);
        expect(bb.getHead()).toBe(a);
        expect(bb.getTail()).toBe(a);
    });
});

describe('BasicBlock predecessor/successor management', () => {
    it('predecessor list grows via addPredecessorBlock and is order-preserving', () => {
        const a = new BasicBlock(1);
        const b = new BasicBlock(2);
        const c = new BasicBlock(3);

        a.addPredecessorBlock(b);
        a.addPredecessorBlock(c);
        expect(a.getPredecessors()).toEqual([b, c]);
    });

    it('successor list grows via addSuccessorBlock and is order-preserving', () => {
        const a = new BasicBlock(1);
        const b = new BasicBlock(2);
        const c = new BasicBlock(3);

        a.addSuccessorBlock(b);
        a.addSuccessorBlock(c);
        expect(a.getSuccessors()).toEqual([b, c]);
    });

    it('setPredecessorBlock/setSuccessorBlock replace by index and validate bounds', () => {
        const a = new BasicBlock();
        const b = new BasicBlock();
        const c = new BasicBlock();
        const d = new BasicBlock();

        a.addPredecessorBlock(b);
        a.addSuccessorBlock(c);

        expect(a.setPredecessorBlock(0, d)).toBe(true);
        expect(a.getPredecessors()).toEqual([d]);
        expect(a.setPredecessorBlock(5, d)).toBe(false);

        expect(a.setSuccessorBlock(0, d)).toBe(true);
        expect(a.getSuccessors()).toEqual([d]);
        expect(a.setSuccessorBlock(5, d)).toBe(false);
    });

    it('removePredecessorBlock/removeSuccessorBlock drop matching entries', () => {
        const a = new BasicBlock();
        const b = new BasicBlock();
        const c = new BasicBlock();

        a.addPredecessorBlock(b);
        a.addPredecessorBlock(c);
        expect(a.removePredecessorBlock(b)).toBe(true);
        expect(a.getPredecessors()).toEqual([c]);
        expect(a.removePredecessorBlock(b)).toBe(false);

        a.addSuccessorBlock(b);
        a.addSuccessorBlock(c);
        expect(a.removeSuccessorBlock(c)).toBe(true);
        expect(a.getSuccessors()).toEqual([b]);
        expect(a.removeSuccessorBlock(c)).toBe(false);
    });

    it('addStmtToFirst is an alias for addHead', () => {
        const bb = new BasicBlock();
        const a = new ArkReturnVoidStmt();
        const b = new ArkReturnVoidStmt();
        bb.addStmt(a);
        bb.addStmtToFirst(b);
        expect(bb.getStmts()).toEqual([b, a]);
    });
});

describe('BasicBlock exceptional successors/predecessors', () => {
    it('getters return undefined when no exceptional edges have been added', () => {
        const bb = new BasicBlock();
        expect(bb.getExceptionalPredecessorBlocks()).toBeUndefined();
        expect(bb.getExceptionalSuccessorBlocks()).toBeUndefined();
    });

    it('addExceptionalPredecessorBlock lazily creates the array and appends', () => {
        const a = new BasicBlock();
        const b = new BasicBlock();
        const c = new BasicBlock();

        a.addExceptionalPredecessorBlock(b);
        a.addExceptionalPredecessorBlock(c);
        expect(a.getExceptionalPredecessorBlocks()).toEqual([b, c]);
    });

    it('addExceptionalSuccessorBlock lazily creates the array and appends', () => {
        const a = new BasicBlock();
        const b = new BasicBlock();
        const c = new BasicBlock();

        a.addExceptionalSuccessorBlock(b);
        a.addExceptionalSuccessorBlock(c);
        expect(a.getExceptionalSuccessorBlocks()).toEqual([b, c]);
    });
});

describe('BasicBlock validate', () => {
    it('returns OK when there are no branch/return stmts', () => {
        const bb = new BasicBlock();
        const result = bb.validate();
        expect(result.errCode).toBe(ArkErrorCode.OK);
    });

    it('returns OK when the only branch/return stmt is at the tail', () => {
        const bb = new BasicBlock();
        bb.addStmt(new ArkReturnStmt(new NumberConstant('1')));
        expect(bb.validate().errCode).toBe(ArkErrorCode.OK);
    });

    it('flags a non-tail return as BB_BRANCH_RET_STMT_NOT_AT_END', () => {
        // Layout: [return; x = 1] -> the return is a branch stmt but
        // appears before the tail (an ArkAssignStmt).
        const bb = new BasicBlock();
        bb.addStmt(new ArkReturnVoidStmt());
        bb.addStmt(new ArkAssignStmt(new Local('x'), new NumberConstant('1')));
        const result = bb.validate();
        expect(result.errCode).toBe(ArkErrorCode.BB_BRANCH_RET_STMT_NOT_AT_END);
    });

    it('flags multiple branch/return stmts as BB_MORE_THAN_ONE_BRANCH_RET_STMT', () => {
        const bb = new BasicBlock();
        bb.addStmt(new ArkReturnVoidStmt());
        bb.addStmt(new ArkReturnStmt(new NumberConstant('1')));
        const result = bb.validate();
        expect(result.errCode).toBe(ArkErrorCode.BB_MORE_THAN_ONE_BRANCH_RET_STMT);
    });
});

describe('BasicBlock toString', () => {
    it('joins stmts with newline-terminated lines', () => {
        const bb = new BasicBlock();
        bb.addStmt(new ArkReturnVoidStmt());
        const out = bb.toString();
        expect(out.endsWith('\n')).toBe(true);
        expect(out.split('\n').filter(s => s.length > 0).length).toBe(1);
    });

    it('returns empty string for an empty block', () => {
        expect(new BasicBlock().toString()).toBe('');
    });
});
