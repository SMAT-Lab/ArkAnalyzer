import { Constant } from "../core/base/Constant";
import { Local } from "../core/base/Local";
import { ArkInstanceFieldRef } from "../core/base/Ref";
import { ArkGotoStmt, ArkIfStmt, Stmt } from "../core/base/Stmt";
import { BasicBlock } from "../core/graph/BasicBlock";
import { Cfg } from "../core/graph/Cfg";

enum BlockType {
    NORMAL,
    WHILE,
    FOR,
    CONTINUE,
    BREAK,
    IF,
    IF_ELSE
}

export class CfgUitls {
    private loopPath: Map<BasicBlock, Set<BasicBlock>>;
    private blockTypes: Map<BasicBlock, BlockType>;
    private blockSize: number;
    
    public constructor(cfg: Cfg) {
        this.blockSize = cfg.getBlocks().size;
        this.identifyBlocks(cfg);
    }

    public getStmtBindValues(stmt: Stmt): Set<Local | Constant | ArkInstanceFieldRef> {
        let values: Set<Local | Constant | ArkInstanceFieldRef> = new Set();
        for (const v of stmt.getUses()) {
            if (v instanceof Local) {
                let localBindValues = this.getLocalBindValues(v);
                localBindValues.forEach((value) => {
                    values.add(value);
                })
            }
        }

        return values;
    }

    public getLocalBindValues(local: Local): Set<Local | Constant | ArkInstanceFieldRef> {
        let values: Set<Local | Constant | ArkInstanceFieldRef> = new Set();
        values.add(local);
        const stmt = local.getDeclaringStmt();
        if (!stmt) {
            return values;
        }

        for (const v of stmt.getUses()) {
            if (v instanceof Constant) {
                values.add(v);
            } else if (v instanceof ArkInstanceFieldRef) {
                values.add(v);
            } else if (v instanceof Local) {
                this.getLocalBindValues(v).forEach((v1) => {
                    values.add(v1);
                });
            }
        }

        return values;
    }

    public getLoopPath(block: BasicBlock): Set<BasicBlock> | undefined {
        return this.loopPath.get(block);
    }

    public isIfBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.IF;
    }

    public isIfElseBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.IF_ELSE;
    }

    public isWhileBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.WHILE;
    }

    public isForBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.FOR;
    }

    public isConinueBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.CONTINUE;
    }

    public isBreakBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.BREAK;
    }

    public isNormalBlock(block: BasicBlock): boolean {
        return this.blockTypes.get(block) == BlockType.NORMAL;
    }

    private identifyBlocks(cfg: Cfg) {
        let blocks = cfg.getBlocks();
        let visitor = new Set<BasicBlock>();
        this.blockTypes = new Map<BasicBlock, BlockType>();
        this.loopPath = new Map<BasicBlock, Set<BasicBlock>>;

        for (const block of blocks) {
            if (visitor.has(block)) {
                continue;
            }
            visitor.add(block);
            if (this.isIfStmtBB(block) && this.isLoopBB(block, visitor)) {
                let stmts = block.getStmts()
                // IfStmt is at the end then it's a while loop
                if (stmts[stmts.length - 1] instanceof ArkIfStmt) {
                    this.blockTypes.set(block, BlockType.WHILE);
                } else {
                    this.blockTypes.set(block, BlockType.FOR);
                }
            } else if (this.isIfStmtBB(block)) {
                if (this.isIfElseBB(block)) {
                    this.blockTypes.set(block, BlockType.IF_ELSE);
                } else {
                    this.blockTypes.set(block, BlockType.IF);
                }
            } else if (this.isGotoStmtBB(block)) {
                if (this.isContinueBB(block, this.blockTypes)) {
                    this.blockTypes.set(block, BlockType.CONTINUE);
                } else {
                    this.blockTypes.set(block, BlockType.BREAK);
                }
            } else {
                this.blockTypes.set(block, BlockType.NORMAL);
            }
        }
    }

    private isIfStmtBB(block: BasicBlock): boolean {
        for (let stmt of block.getStmts()) {
            if (stmt instanceof ArkIfStmt) {
                return true;
            }
        }
        return false;
    }

    private isLoopBB(block: BasicBlock, visitor: Set<BasicBlock>): boolean {
        let onPath: Set<BasicBlock> = new Set<BasicBlock>();
        let loop: boolean = false;
        visitor.delete(block);

        if (block.getSuccessors().length == 0) {
            return loop;
        }

        let next = block.getSuccessors()[0];
        onPath.add(next);
        dfs(next);
        
        visitor.add(block);
        if (loop) {
            this.loopPath.set(block, onPath);
        }
        
        return loop;

        function dfs(_block: BasicBlock): void {
            if (_block === block) {
                loop = true;
                return;
            }
            for (const sub of _block.getSuccessors()) {
                if (!visitor.has(sub) && !onPath.has(sub) && sub != block.getSuccessors()[1]) {
                    onPath.add(sub);
                    dfs(sub);
                }
            }
        }
    }

    private isGotoStmtBB(block: BasicBlock): boolean {
        for (let stmt of block.getStmts()) {
            if (stmt instanceof ArkGotoStmt) {
                return true;
            }
        }
        return false;
    }


    private isContinueBB(block: BasicBlock, blockTypes: Map<BasicBlock, BlockType>): boolean {
        let type = blockTypes.get(block.getSuccessors()[0]);
        let toLoop = false;
        if (type == BlockType.FOR || type == BlockType.WHILE) {
            toLoop = true;
        }

        if (!toLoop) {
            return false;
        }

        let parentLoop: BasicBlock = block;
        let minSize: number = this.blockSize;
        for (let [key, value] of this.loopPath) {
            if (value.has(block) && value.size < minSize) {
                minSize = value.size;
                parentLoop = key;
            }
        }

        if (parentLoop == block.getSuccessors()[0]) {
            return true;
        }

        return false;
    }

    private isIfElseBB(block: BasicBlock): boolean {
        for (const nextBlock of block.getSuccessors()) {
            for (const otherBlock of block.getSuccessors()) {
                if (nextBlock == otherBlock) {
                    continue;
                }

                for (const successor of nextBlock.getSuccessors()) {
                    if (successor == otherBlock) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}