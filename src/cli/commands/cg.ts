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

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { Scene } from '../../Scene';
import { buildSceneConfigFromProject } from '../../Config';
import { CallGraph, CallGraphEdge, CallGraphNode } from '../../callgraph/model/CallGraph';
import { CallGraphBuilder } from '../../callgraph/model/builder/CallGraphBuilder';
import { ArkMethod } from '../../core/model/ArkMethod';
import { MethodSignature } from '../../core/model/ArkSignature';
import { ClassCategory } from '../../core/model/ArkClass';
import { DummyMainCreater } from '../../core/common/DummyMainCreater';
import { ArkAnalyzerError, ArkErrorCode } from '../../core/common/ArkError';

export type CgAlgorithm = 'cha' | 'rta';
export type CgFormat = 'json' | 'text' | 'dot' | 'csv';
export type CgDirection = 'forward' | 'backward';
export type CgEdgeFilter = 'call' | 'virtual' | 'interface' | 'all';

export interface CgCommandOptions {
    algorithm: CgAlgorithm;
    output: string;
    format: CgFormat;
    entry: string[];
    reachableFrom: string[];
    direction: CgDirection;
    edges: CgEdgeFilter;
    ohosSdkHome?: string;
}

interface CgEdgeRow {
    src: string;
    dst: string;
    type: Exclude<CgEdgeFilter, 'all'>;
}

export interface CgAnalyzeResult {
    input: string;
    algorithm: CgAlgorithm;
    algorithmUsed: 'cha' | 'rta';
    format: CgFormat;
    direction: CgDirection;
    edges: CgEdgeFilter;
    entry: string[];
    reachableFrom: string[];
    reachable: string[];
    nodes: string[];
    edgeCount: number;
    edgesData: CgEdgeRow[];
}

export function resolveMethodRef(scene: Scene, spec: string): ArkMethod | null {
    const trimmed = spec.trim();
    const methods = scene.getMethods();

    const exact = methods.find((m) => m.getSignature().toString() === trimmed);
    if (exact) {
        return exact;
    }

    const dotted = /^([^.]+)\.([^.\s]+)$/.exec(trimmed);
    if (dotted) {
        const className = dotted[1];
        const methodName = dotted[2];
        const hits = methods.filter(
            (m) => m.getDeclaringArkClass().getName() === className && m.getName() === methodName
        );
        if (hits.length === 1) {
            return hits[0];
        }
        if (hits.length > 1) {
            throw new ArkAnalyzerError({
                errCode: ArkErrorCode.CLI_AMBIGUOUS_METHOD_REF,
                errMsg:
                    `Ambiguous method ref "${trimmed}": ${hits.length} matches. Use a full signature string.\n` +
                    hits.map((h) => h.getSignature().toString()).join('\n'),
            });
        }
    }

    const substrHits = methods.filter((m) => m.getSignature().toString().includes(trimmed));
    if (substrHits.length === 1) {
        return substrHits[0];
    }
    if (substrHits.length > 1) {
        throw new ArkAnalyzerError({
            errCode: ArkErrorCode.CLI_AMBIGUOUS_METHOD_REF,
            errMsg:
                `Ambiguous method ref "${trimmed}": ${substrHits.length} substring matches. Use ClassName.methodName or full signature.\n` +
                substrHits
                    .slice(0, 15)
                    .map((h) => h.getSignature().toString())
                    .join('\n') +
                (substrHits.length > 15 ? '\n...' : ''),
        });
    }

    return null;
}

function pickEntries(scene: Scene, refs: string[]): MethodSignature[] {
    if (refs.length > 0) {
        return refs.map((r) => {
            const m = resolveMethodRef(scene, r);
            if (!m) {
                throw new ArkAnalyzerError({
                    errCode: ArkErrorCode.CLI_ENTRY_METHOD_NOT_FOUND,
                    errMsg: `Entry method not found: ${r}`,
                });
            }
            return m.getSignature();
        });
    }

    const mains = scene.getMethods().filter((m) => m.getName() === 'main');
    if (mains.length > 0) {
        return mains.map((m) => m.getSignature());
    }

    return scene.getMethods().filter((m) => m.getCfg() !== undefined).map((m) => m.getSignature());
}

function buildGraphForCg(scene: Scene, algorithm: CgAlgorithm, entryRefs: string[]): { cg: CallGraph; algorithmUsed: 'cha' | 'rta'; entry: string[] } {
    // default create dummy main method is @dummyMain
    const dummyMainCreator = new DummyMainCreater(scene);
    dummyMainCreator.createDummyMain();

    const entries = pickEntries(scene, entryRefs);
    const cg = new CallGraph(scene);
    const builder = new CallGraphBuilder(cg, scene);

    let algorithmUsed: 'cha' | 'rta' = 'rta';
    if (algorithm === 'cha') {
        algorithmUsed = 'cha';
        if (entries.length === 0) {
            builder.buildCHA4WholeProject(false);
        } else {
            builder.buildClassHierarchyCallGraph(entries, false);
        }
    } else {
        algorithmUsed = 'rta';
        if (entries.length === 0) {
            builder.buildRTA4WholeProject(false);
        } else {
            builder.buildRapidTypeCallGraph(entries, false);
        }
    }

    return { cg, algorithmUsed, entry: entries.map((e) => e.toString()) };
}

function classifyEdge(scene: Scene, edge: CallGraphEdge): Exclude<CgEdgeFilter, 'all'> {
    if (edge.hasIndirectCall()) {
        const dst = (edge.getDstNode() as CallGraphNode).getMethod();
        const dstMethod = scene.getMethod(dst);
        if (dstMethod && dstMethod.getDeclaringArkClass().getCategory() === ClassCategory.INTERFACE) {
            return 'interface';
        }
        return 'virtual';
    }
    return 'call';
}

function edgeMatchesFilter(kind: Exclude<CgEdgeFilter, 'all'>, filter: CgEdgeFilter): boolean {
    if (filter === 'all') {
        return true;
    }
    return kind === filter;
}

function reachableNodeIds(cg: CallGraph, starts: number[], direction: CgDirection, edges: CgEdgeRow[]): Set<number> {
    const bySrc = new Map<number, number[]>();
    const byDst = new Map<number, number[]>();

    const sigToId = new Map<string, number>();
    for (const n of cg.getNodesIter()) {
        const cn = n as CallGraphNode;
        sigToId.set(cn.getMethod().toString(), cn.getID());
    }
    for (const e of edges) {
        const s = sigToId.get(e.src);
        const d = sigToId.get(e.dst);
        if (s === undefined || d === undefined) {
            continue;
        }
        if (!bySrc.has(s)) {
            bySrc.set(s, []);
        }
        if (!byDst.has(d)) {
            byDst.set(d, []);
        }
        bySrc.get(s)!.push(d);
        byDst.get(d)!.push(s);
    }

    const q = [...starts];
    const seen = new Set<number>(q);
    while (q.length > 0) {
        const x = q.shift()!;
        const next = direction === 'forward' ? (bySrc.get(x) ?? []) : (byDst.get(x) ?? []);
        for (const y of next) {
            if (!seen.has(y)) {
                seen.add(y);
                q.push(y);
            }
        }
    }
    return seen;
}

function formatDot(edges: CgEdgeRow[]): string {
    const lines = ['digraph CG {'];
    for (const e of edges) {
        lines.push(`  "${e.src}" -> "${e.dst}" [label="${e.type}"];`);
    }
    lines.push('}');
    return lines.join('\n');
}

function formatCsv(edges: CgEdgeRow[]): string {
    const rows = ['src,dst,type'];
    for (const e of edges) {
        rows.push(`"${e.src.replace(/"/g, '""')}","${e.dst.replace(/"/g, '""')}",${e.type}`);
    }
    return rows.join('\n');
}

function formatText(result: CgAnalyzeResult): string {
    const lines: string[] = [];
    lines.push(`algorithm: ${result.algorithm} (used: ${result.algorithmUsed})`);
    lines.push(`edges-filter: ${result.edges}`);
    lines.push(`nodes: ${result.nodes.length}, edges: ${result.edgeCount}`);
    if (result.reachableFrom.length > 0) {
        lines.push(`reachable-from (${result.direction}):`);
        for (const r of result.reachableFrom) {
            lines.push(`  - ${r}`);
        }
        lines.push('reachable-set:');
        for (const r of result.reachable) {
            lines.push(`  - ${r}`);
        }
    }
    lines.push('edges:');
    for (const e of result.edgesData) {
        lines.push(`  ${e.src} -> ${e.dst} [${e.type}]`);
    }
    return lines.join('\n');
}

function parseAndValidate(raw: CgCommandOptions): CgCommandOptions {
    const algorithm = raw.algorithm as CgAlgorithm;
    const format = raw.format as CgFormat;
    const direction = raw.direction as CgDirection;
    const edges = raw.edges as CgEdgeFilter;

    if (!['cha', 'rta'].includes(algorithm)) {
        throw new ArkAnalyzerError({
            errCode: ArkErrorCode.CLI_INVALID_OPTION,
            errMsg: `Invalid --algorithm: ${raw.algorithm} (expected cha | rta)`,
        });
    }
    if (!['json', 'text', 'dot', 'csv'].includes(format)) {
        throw new ArkAnalyzerError({
            errCode: ArkErrorCode.CLI_INVALID_OPTION,
            errMsg: `Invalid --format: ${raw.format} (expected json | text | dot | csv)`,
        });
    }
    if (!['forward', 'backward'].includes(direction)) {
        throw new ArkAnalyzerError({
            errCode: ArkErrorCode.CLI_INVALID_OPTION,
            errMsg: `Invalid --direction: ${raw.direction} (expected forward | backward)`,
        });
    }
    if (!['call', 'virtual', 'interface', 'all'].includes(edges)) {
        throw new ArkAnalyzerError({
            errCode: ArkErrorCode.CLI_INVALID_OPTION,
            errMsg: `Invalid --edges: ${raw.edges} (expected call | virtual | interface | all)`,
        });
    }

    return {
        algorithm,
        output: raw.output,
        format,
        entry: raw.entry ?? [],
        reachableFrom: raw.reachableFrom ?? [],
        direction,
        edges,
        ohosSdkHome: raw.ohosSdkHome,
    };
}

function formatOutput(result: CgAnalyzeResult, filteredEdges: CgEdgeRow[]): string {
    if (result.format === 'json') {
        return JSON.stringify(result);
    }
    if (result.format === 'text') {
        return formatText(result);
    }
    if (result.format === 'dot') {
        return formatDot(filteredEdges);
    }
    return formatCsv(filteredEdges);
}

function writeOutput(outputPath: string, content: string): void {
    if (outputPath === 'stdout') {
        process.stdout.write(`${content}\n`);
        return;
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${content}\n`);
}

function buildSceneForCg(input: string, ohosSdkHome?: string): Scene {
    const config = buildSceneConfigFromProject(input, ohosSdkHome);
    const scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    return scene;
}

function collectFilteredEdgeRows(scene: Scene, cg: CallGraph, edgeFilter: CgEdgeFilter): CgEdgeRow[] {
    const edgeRows: CgEdgeRow[] = [];
    for (const edge of cg.getCallEdges()) {
        const type = classifyEdge(scene, edge);
        if (!edgeMatchesFilter(type, edgeFilter)) {
            continue;
        }
        edgeRows.push({
            src: (edge.getSrcNode() as CallGraphNode).getMethod().toString(),
            dst: (edge.getDstNode() as CallGraphNode).getMethod().toString(),
            type,
        });
    }
    return edgeRows;
}

function buildNodeSignatureIndex(cg: CallGraph): { sigToId: Map<string, number>; idToSig: Map<number, string> } {
    const sigToId = new Map<string, number>();
    const idToSig = new Map<number, string>();
    for (const n of cg.getNodesIter()) {
        const cn = n as CallGraphNode;
        const sig = cn.getMethod().toString();
        sigToId.set(sig, cn.getID());
        idToSig.set(cn.getID(), sig);
    }
    return { sigToId, idToSig };
}

function resolveReachabilityRoots(scene: Scene, specs: string[]): string[] {
    return specs
        .map((r) => resolveMethodRef(scene, r))
        .filter((m): m is ArkMethod => m !== null)
        .map((m) => m.getSignature().toString());
}

function collectReachableIds(
    cg: CallGraph,
    roots: string[],
    sigToId: Map<string, number>,
    direction: CgDirection,
    edges: CgEdgeRow[]
): Set<number> {
    if (roots.length === 0) {
        return new Set<number>();
    }
    const starts = roots.map((s) => sigToId.get(s)).filter((x): x is number => x !== undefined);
    return reachableNodeIds(cg, starts, direction, edges);
}

function filterEdgesByReachability(edgeRows: CgEdgeRow[], reachableIds: Set<number>, sigToId: Map<string, number>): CgEdgeRow[] {
    if (reachableIds.size === 0) {
        return edgeRows;
    }

    // Keep only subgraph edges whose both endpoints are in the reachable node set.
    return edgeRows.filter((e) => {
        const sid = sigToId.get(e.src);
        const did = sigToId.get(e.dst);
        return sid !== undefined && did !== undefined && reachableIds.has(sid) && reachableIds.has(did);
    });
}

function idsToSortedSignatures(ids: Set<number>, idToSig: Map<number, string>): string[] {
    return Array.from(ids)
        .map((id) => idToSig.get(id))
        .filter((s): s is string => s !== undefined)
        .sort();
}

function collectOutputNodes(reachableIds: Set<number>, idToSig: Map<number, string>): string[] {
    if (reachableIds.size === 0) {
        return Array.from(idToSig.values()).sort();
    }
    return idsToSortedSignatures(reachableIds, idToSig);
}

export function analyzeCg(input: string, options: CgCommandOptions): CgAnalyzeResult {
    const scene = buildSceneForCg(input, options.ohosSdkHome);
    const { cg, algorithmUsed, entry } = buildGraphForCg(scene, options.algorithm, options.entry);
    const edgeRows = collectFilteredEdgeRows(scene, cg, options.edges);
    const reachableFrom = resolveReachabilityRoots(scene, options.reachableFrom);
    const { sigToId, idToSig } = buildNodeSignatureIndex(cg);
    const reachableIds = collectReachableIds(cg, reachableFrom, sigToId, options.direction, edgeRows);
    const filteredEdges = filterEdgesByReachability(edgeRows, reachableIds, sigToId);
    const reachable = idsToSortedSignatures(reachableIds, idToSig);
    const nodes = collectOutputNodes(reachableIds, idToSig);

    return {
        input,
        algorithm: options.algorithm,
        algorithmUsed,
        format: options.format,
        direction: options.direction,
        edges: options.edges,
        entry,
        reachableFrom,
        reachable,
        nodes,
        edgeCount: filteredEdges.length,
        edgesData: filteredEdges,
    };
}


export function runCgCommand(input: string, raw: CgCommandOptions): void {
    const options = parseAndValidate(raw);
    const result = analyzeCg(input, options);
    writeOutput(options.output, formatOutput(result, result.edgesData));
}

/**
 * Register call-graph command.
 *
 * Usage:
 *   arkanalyzer cg <input> [options]
 *
 * Examples:
 *   arkanalyzer cg ./my_project -a rta -f json
 *   arkanalyzer cg ./my_project -e "@dummyMain" -r "Dog.sound" --direction backward -f text
 *   arkanalyzer cg ./my_project -f dot -o ./out/cg.dot --edges all
 */
export function register(program: Command): void {
    program
        .command('cg <input>')
        .description('Build call graph and export/query analysis results for a project')
        .option('-a, --algorithm <name>', 'Build algorithm: cha | rta', 'rta')
        .option('-o, --output <file>', 'Output file path', 'stdout')
        .option('-f, --format <type>', 'Output format: json | text | dot | csv', 'json')
        .option('-e, --entry <method>', 'Specify entry method (repeatable)', (v: string, prev: string[]) => {
            prev.push(v);
            return prev;
        }, [])
        .option('-r, --reachable-from <method>', 'Reachability roots (repeatable)', (v: string, prev: string[]) => {
            prev.push(v);
            return prev;
        }, [])
        .option('--direction <dir>', 'Reachability direction: forward | backward', 'forward')
        .option('--edges <type>', 'Edge filter: call | virtual | interface | all', 'all')
        .option('--ohos-sdk-home <path>', 'OHOS SDK home. Fallback to env OHOS_SDK_HOME')
        .action((input: string, opts: CgCommandOptions) => {
            runCgCommand(input, opts);
        });
}
