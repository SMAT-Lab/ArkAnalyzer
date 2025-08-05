/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

namespace Context_Case_1 {
    class Payload {
        constructor(public value: number) { }
    }

    class Node {
        id: number;
        child: Node | null = null;
        data: Payload | null = null; // 类型更明确

        constructor(id: number) {
            this.id = id;
        }
    }

    function buildChain(node: Node, depth: number): void {
        if (depth <= 0) {
            return;
        }

        // 每个节点关联一个独立的 Payload 实例
        node.data = new Payload(depth);

        const newChild = new Node(node.id + 1);
        node.child = newChild;

        buildChain(newChild, depth - 1);
    }

    function main(): void {
        const root = new Node(0);
        buildChain(root, 2);
    }
}