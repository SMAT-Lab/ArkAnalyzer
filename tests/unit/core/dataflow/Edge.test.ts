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
import { ArkReturnVoidStmt, PathEdge, PathEdgePoint } from '../../../../src';

describe('PathEdgePoint Test', () => {
    it('stores node and fact passed via the constructor', () => {
        const stmt = new ArkReturnVoidStmt();
        const p = new PathEdgePoint<number>(stmt, 123);

        expect(p.node).toBe(stmt);
        expect(p.fact).toBe(123);
    });

    it('supports arbitrary fact types via the generic parameter', () => {
        const stmt = new ArkReturnVoidStmt();

        const pStr = new PathEdgePoint<string>(stmt, 'tainted');
        expect(pStr.fact).toBe('tainted');

        interface Fact {
            tainted: boolean;
            path: string[];
        }
        const factObj: Fact = { tainted: true, path: ['src'] };
        const pObj = new PathEdgePoint<Fact>(stmt, factObj);
        expect(pObj.fact).toBe(factObj);
        expect(pObj.fact.tainted).toBe(true);
    });

    it('fields are writable at runtime', () => {
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const p = new PathEdgePoint<number>(s1, 0);

        p.node = s2;
        p.fact = 99;
        expect(p.node).toBe(s2);
        expect(p.fact).toBe(99);
    });
});

describe('PathEdge Test', () => {
    it('stores the start and end edge points', () => {
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const start = new PathEdgePoint<number>(s1, 1);
        const end = new PathEdgePoint<number>(s2, 2);

        const edge = new PathEdge<number>(start, end);
        expect(edge.edgeStart).toBe(start);
        expect(edge.edgeEnd).toBe(end);
        expect(edge.edgeStart.fact).toBe(1);
        expect(edge.edgeEnd.fact).toBe(2);
    });

    it('allows start and end to share the same PathEdgePoint (self-edge)', () => {
        const stmt = new ArkReturnVoidStmt();
        const p = new PathEdgePoint<string>(stmt, 'x');
        const edge = new PathEdge<string>(p, p);

        expect(edge.edgeStart).toBe(edge.edgeEnd);
        expect(edge.edgeStart.fact).toBe('x');
    });

    it('preserves node/fact references through the edge', () => {
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const start = new PathEdgePoint<string>(s1, 'start');
        const end = new PathEdgePoint<string>(s2, 'end');
        const edge = new PathEdge<string>(start, end);

        expect(edge.edgeStart.node).toBe(s1);
        expect(edge.edgeEnd.node).toBe(s2);
    });

    it('different edges are independent', () => {
        const s1 = new ArkReturnVoidStmt();
        const s2 = new ArkReturnVoidStmt();
        const a = new PathEdge<number>(
            new PathEdgePoint<number>(s1, 1),
            new PathEdgePoint<number>(s2, 2),
        );
        const b = new PathEdge<number>(
            new PathEdgePoint<number>(s2, 3),
            new PathEdgePoint<number>(s1, 4),
        );

        expect(a.edgeStart).not.toBe(b.edgeStart);
        expect(a.edgeStart.fact).toBe(1);
        expect(b.edgeStart.fact).toBe(3);
    });
});
