import { Stmt } from "../base/Stmt";
import { BasicBlock } from "./BasicBlock";

export class Cfg {
    private blocks: Set<BasicBlock> = new Set();
    private stmtToBlock: Map<Stmt, BasicBlock> = new Map();
    private startingStmt: Stmt = new Stmt();

    constructor() {

    }

    public getStmts(): Stmt[] {
        let stmts = new Array<Stmt>();
        for (const block of this.blocks) {
            stmts.push(...block.getStmts());
        }
        return stmts;
    }

    // TODO
    public insertBefore(beforeStmt: Stmt, newStmt: Stmt): void {

    }

    // TODO: 添加block之间的边
    public addBlock(block: BasicBlock): void {
        this.blocks.add(block);
    }


    public getBlocks(): Set<BasicBlock> {
        return this.blocks;
    }

    
    public getStartingBlock(): BasicBlock {
        return this.stmtToBlock.get(this.startingStmt) as BasicBlock;
    }

    // TODO: 整理成类似jimple的输出
    public toString(): string {
        return 'cfg';
    }
}