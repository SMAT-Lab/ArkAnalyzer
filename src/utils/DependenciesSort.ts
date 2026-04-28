/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { ArkFile } from '../core/model/ArkFile';
import { getArkFile } from '../core/common/ModelUtils';
import { FromInfo } from '../core/model/ArkExport';

export function sortByDependency(filesMap: Map<string, ArkFile>, projectName: string): ArkFile[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();
    filesMap.forEach((file, key) => {
        inDegree.set(key, 0);
        adjacency.set(key, new Set());
    });
    // Build dependency graph: if file A imports file B, add edge B -> A (B should be processed before A)
    filesMap.forEach((file, fileKey) => {
        let fromInfos: FromInfo[] = file.getImportInfos();
        fromInfos = fromInfos.concat(file.getExportInfos());
        for (const importInfo of fromInfos) {
            const depFile = getArkFile(importInfo);
            if (!depFile || depFile.getProjectName() !== projectName) {
                continue;
            }
            const depKey = depFile.getFileSignature().toMapKey();
            let importedFilesSet = adjacency.get(depKey);
            if (depKey !== fileKey && importedFilesSet && !importedFilesSet.has(fileKey)) {
                importedFilesSet.add(fileKey);
                inDegree.set(fileKey, (inDegree.get(fileKey) || 0) + 1);
            }
        }
    });
    // Topological sort (Kahn's algorithm)
    const queue: string[] = [];
    for (const [key, degree] of inDegree) {
        if (degree === 0) {
            queue.push(key);
        }
    }
    const result: ArkFile[] = [];
    const visited = new Set<string>();
    while (queue.length > 0) {
        const current = queue.shift()!;
        visited.add(current);
        result.push(filesMap.get(current)!);
        for (const neighbor of adjacency.get(current)!) {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }
    // Add remaining files that are part of cycles
    filesMap.forEach((file, key) => {
        if (!visited.has(key)) {
            result.push(file);
        }
    });
    return result;
}