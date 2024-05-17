import { BasicBlock } from "../core/graph/BasicBlock";
import { ArkClass } from "../core/model/ArkClass";
import { ArkMethod } from "../core/model/ArkMethod";
import { ArkNamespace } from "../core/model/ArkNamespace";
import { ArkStream } from "./ArkStream";
import { Printer } from "./Printer";


export class DotPrinter extends Printer {
    public printTo(streamOut: ArkStream): void {
        streamOut.writeLine(`digraph "${this.arkFile.getName()}" {`);
        streamOut.incIndent();

        // print namespace
        for (let ns of this.arkFile.getNamespaces()) {
            this.printNamespace(ns, streamOut);
        }

        // print class 
        for (let cls of this.arkFile.getClasses()) {
            this.printClass(cls, streamOut);
        }

        streamOut.decIndent();
        streamOut.writeLine('}');
    }

    protected printNamespace(ns: ArkNamespace, streamOut: ArkStream): void {
        // print class 
        for (let cls of ns.getClasses()) {
            this.printClass(cls, streamOut);
        }

        // print namespace
        for (let childNs of ns.getNamespaces()) {
            this.printNamespace(childNs, streamOut);
        }
    }
    
    protected printClass(cls: ArkClass, streamOut: ArkStream): void {
        for (let method of cls.getMethods()) {
            this.printMethod3ACBlocks(method, streamOut);
            this.printMethodOriginalBlocks(method, streamOut);        
        }
    }

    private printMethod3ACBlocks(method: ArkMethod, streamOut: ArkStream): void {
        streamOut.writeIndent().writeLine(`subgraph "cluster_${method.getSignature()}" {`);
        streamOut.incIndent();
        streamOut.writeIndent().writeLine(`label="${method.getSignature()}";`);

        let blocks = method.getBody().getCfg().getBlocks();
        let prefix = `Node${this.stringHashCode(method.getSignature().toString())}`
        this.printBlocks(blocks, prefix, streamOut);

        streamOut.decIndent();
        streamOut.writeIndent().writeLine('}');
    }
    
    private printMethodOriginalBlocks(method: ArkMethod, streamOut: ArkStream): void {
        streamOut.writeIndent().writeLine(`subgraph "cluster_Original_${method.getSignature()}" {`);
        streamOut.incIndent();
        streamOut.writeIndent().writeLine(`label="${method.getSignature()}_original";`);

        let blocks = method.getBody().getOriginalCfg().getBlocks();
        let prefix = `NodeOriginal${this.stringHashCode(method.getSignature().toString())}`
        this.printBlocks(blocks, prefix, streamOut);

        streamOut.decIndent();
        streamOut.writeIndent().writeLine('}');
    }

    private printBlocks(blocks: Set<BasicBlock>, prefix: string, streamOut: ArkStream): void {
        let blockToNode: Map<BasicBlock, string> = new Map<BasicBlock, string>();
        let index = 0;
        for (let block of blocks) {
            let name = prefix + index++;
            blockToNode.set(block, name);
            // Node0 [label="entry"];
            streamOut.writeIndent().writeLine(`${name} [label="${this.getBlockContent(block, streamOut.getIndent())}"];`);
        }

        for (let block of blocks) {
            for (let nextBlock of block.getSuccessors()) {
                // Node0 -> Node1;
                streamOut.writeIndent().writeLine(`${blockToNode.get(block)} -> ${blockToNode.get(nextBlock)};`);
            }
        }
    }

    private stringHashCode(name: string): number {
        let hashCode = 0;
        for (let i = 0 ; i < name.length; i++) {
            hashCode += name.charCodeAt(i);
        }
        return Math.abs(hashCode);
    }

    private getBlockContent(block: BasicBlock, indent: string): string {
        let content: string[] = [];
        for (let stmt of block.getStmts()) {
            content.push(stmt.toString().replace(/"/g, '\\"'));
        }
        return content.join('\n    ' + indent);
    }
}