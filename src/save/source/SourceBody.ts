
import { ArkInstanceInvokeExpr } from '../../core/base/Expr';
import { Local } from "../../core/base/Local";
import { ArkParameterRef } from "../../core/base/Ref";
import { ArkAssignStmt, ArkGotoStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, ArkSwitchStmt, Stmt } from '../../core/base/Stmt';
import { BasicBlock } from '../../core/graph/BasicBlock';
import { DominanceFinder } from "../../core/graph/DominanceFinder";
import { DominanceTree } from "../../core/graph/DominanceTree";
import { ArkBody } from "../../core/model/ArkBody";
import { ArkFile } from '../../core/model/ArkFile';
import { SourceAssignStmt, SourceBreakStmt, SourceCaseStmt, SourceCompoundEndStmt, SourceContinueStmt, SourceElseStmt, SourceForStmt, SourceIfStmt, SourceInvokeStmt, SourceReturnStmt, SourceReturnVoidStmt, SourceSwitchStmt, SourceWhileStmt } from './SourceStmt';
import { SourceBase } from './SourceBase';
import { SourceUtils } from './SourceUtils';

enum BlockType {
    NORMAL,
    WHILE,
    FOR,
    CONTINUE,
    BREAK,
    IF,
    IF_ELSE
}

export class SourceBody extends SourceBase {
    
    private arkBody: ArkBody;
    private stmts: Stmt[] = [];
    private dominanceTree: DominanceTree;
    private blockTypes: Map<BasicBlock, BlockType>;
    private loopPath: Map<BasicBlock, Set<BasicBlock>>;
    
    public constructor(indent: string, arkFile: ArkFile, arkBody: ArkBody) {
        super(indent, arkFile);
        this.arkBody = arkBody;
        this.dominanceTree = new DominanceTree(new DominanceFinder(arkBody.getCfg()));
        this.identifyBlocks();
        this.buildSourceStmt();
    }

    public dumpOriginalCode(): string {
        throw new Error('Method not implemented.');
    }
    public getLine(): number {
        throw new Error('Method not implemented.');
    }

    public dump(): string {
        this.printLocals();
        this.printStmts();

        return this.printer.toString();
    }

    private identifyBlocks() {
        let blocks = this.arkBody.getCfg().getBlocks();
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
        let stmtReader: StmtReader =  new StmtReader(block.getStmts());
        while (stmtReader.hasNext()) {
            let stmt = stmtReader.next();
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

        let next = block.getSuccessors()[0];
        onPath.add(next);
        dfs(next);
        
        visitor.add(block);
        this.loopPath.set(block, onPath);
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
        let stmtReader: StmtReader =  new StmtReader(block.getStmts());
        while (stmtReader.hasNext()) {
            let stmt = stmtReader.next();
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
        let minSize: number = this.arkBody.getCfg().getBlocks().size;
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
            // if block dominates successorBlocks[i], than successorBlocks[i] not in branch
            if (this.hasDominated(block, nextBlock)) {
                return false;
            }
        }
        return true;
    }

    private buildSourceStmt() {
        let blocks = this.arkBody.getCfg().getBlocks();
        let visitor = new Set<BasicBlock>();

        for (const block of blocks) {
            if (visitor.has(block)) {
                continue;
            }
            visitor.add(block);
            this.buildBasicBlock(block, visitor, null);
        }
    }

    private buildBasicBlock(block: BasicBlock, visitor: Set<BasicBlock>, parent: Stmt|null): void {
        let originalStmts: Stmt[] = this.sortStmt(block.getStmts());
        let stmtReader: StmtReader =  new StmtReader(originalStmts);
        while (stmtReader.hasNext()) {
            let stmt = stmtReader.next();
            if (stmt instanceof ArkAssignStmt) {
                this.stmts.push(new SourceAssignStmt(stmt, stmtReader));
            } else if (stmt instanceof ArkIfStmt) {
                let isLoop = false;
                if (this.blockTypes.get(block) == BlockType.FOR) {
                    this.stmts.push(new SourceForStmt(stmt, stmtReader));
                    isLoop = true;
                } else if (this.blockTypes.get(block) == BlockType.WHILE) {
                    this.stmts.push(new SourceWhileStmt(stmt, stmtReader));
                    isLoop = true;
                }
                if (isLoop) {
                    for (const sub of this.loopPath.get(block) as Set<BasicBlock>) {
                        if (visitor.has(sub)) {
                            continue;
                        }
                        visitor.add(sub);
                        this.buildBasicBlock(sub, visitor, parent);
                    }
                    this.stmts.push(new SourceCompoundEndStmt('}'));
                } else {
                    this.stmts.push(new SourceIfStmt(stmt, stmtReader));
                    let successorBlocks = block.getSuccessors();
                    if (this.blockTypes.get(block) == BlockType.IF_ELSE) {
                        visitor.add(successorBlocks[1]);
                        this.buildBasicBlock(successorBlocks[1], visitor, stmt);
                    }
                    if (successorBlocks.length > 0 && !visitor.has(successorBlocks[0])) {
                        this.stmts.push(new SourceElseStmt(stmt, stmtReader));
                        visitor.add(successorBlocks[0]);
                        this.buildBasicBlock(successorBlocks[0], visitor, stmt);
                    }
                    this.stmts.push(new SourceCompoundEndStmt('}'));
                }
            } else if (stmt instanceof ArkInvokeStmt) {
                this.stmts.push(new SourceInvokeStmt(stmt, stmtReader));
            } else if (stmt instanceof ArkReturnVoidStmt) {
                this.stmts.push(new SourceReturnVoidStmt(stmt, stmtReader));
            } else if (stmt instanceof ArkSwitchStmt) {
                this.stmts.push(new SourceSwitchStmt(stmt, stmtReader));
                let caseIdx = 0;
                for (const sub of block.getSuccessors()) {
                    if (!visitor.has(sub)) {
                        visitor.add(sub);
                        let caseStmt = new SourceCaseStmt(stmt, stmtReader, caseIdx);
                        this.stmts.push(caseStmt);
                        this.buildBasicBlock(sub, visitor, stmt);
                        if (caseStmt.isDefault()) {
                            this.stmts.push(new SourceCompoundEndStmt(''));
                        }
                    }
                    caseIdx++;
                }
                this.stmts.push(new SourceCompoundEndStmt('}'));
            } else if (stmt instanceof ArkGotoStmt) {
                if (parent instanceof ArkSwitchStmt) {
                    this.stmts.push(new SourceCompoundEndStmt('    break;'));
                } else {
                    if (this.blockTypes.get(block) == BlockType.CONTINUE) {
                        this.stmts.push(new SourceContinueStmt(stmt, stmtReader));
                    } else {
                        this.stmts.push(new SourceBreakStmt(stmt, stmtReader));
                    }
                    
                }
            } else if (stmt instanceof ArkReturnStmt) {
                this.stmts.push(new SourceReturnStmt(stmt, stmtReader));
            } else {
                this.stmts.push(stmt);
            }
        }
    }

    private printLocals() {
        for (let local of this.arkBody.getLocals()) {
            // not define this
            if (local.getName() == 'this' || local.getName() == 'console') {
                continue;
            }
                                
            // not define parameter
            if (local.getDeclaringStmt() instanceof ArkAssignStmt) {
                let assignStmt:ArkAssignStmt = local.getDeclaringStmt() as ArkAssignStmt;
                if (assignStmt.getRightOp() instanceof ArkParameterRef) {
                    continue;
                }
            }
            this.printer.writeIndent().writeLine(`let ${local.getName()}: ${SourceUtils.typeToString(local.getType())};`);
            console.log('SourceBody->printLocals:', local);
        }
    }

    private printStmts() {
        for (let stmt of this.stmts) {
            if (stmt instanceof SourceSwitchStmt || stmt instanceof SourceCaseStmt
                || stmt instanceof SourceIfStmt || stmt instanceof SourceWhileStmt
                || stmt instanceof SourceForStmt) {
                this.printer.writeIndent().writeLine(stmt.toString());
                this.printer.incIndent();
            } else if (stmt instanceof SourceElseStmt) {
                this.printer.decIndent();
                this.printer.writeIndent().writeLine(stmt.toString());
                this.printer.incIndent();
            } else if (stmt instanceof SourceCompoundEndStmt) {
                this.printer.decIndent();
                this.printer.writeIndent().writeLine(stmt.toString());
            } else {
                this.printer.writeIndent().writeLine(stmt.toString());
            }
        }
    }

    private hasDominated(srcBlock: BasicBlock, dstBlock: BasicBlock): boolean {
        for (let child of this.dominanceTree.getChildren(srcBlock)) {
            if (child == dstBlock) {
                return true;
            }
        }
        return false;
    }

    /*
        temp9 = new <>.<>();                            temp10 = new Array<number>(3);
        temp10 = new Array<number>(3);                  temp10[0] = "Cat";
        temp10[0] = "Cat";                        ==>   temp10[1] = "Dog";
        temp10[1] = "Dog";                              temp10[2] = "Hamster";
        temp10[2] = "Hamster";                          temp9 = new <>.<>();
        temp9.constructor(temp10);                      temp9.constructor(temp10);
    */
    private sortStmt(stmts: Stmt[]): Stmt[] {
        for (let i = stmts.length -1; i > 0; i--) {
            if (stmts[i] instanceof ArkInvokeStmt && stmts[i].getInvokeExpr() as ArkInstanceInvokeExpr) {
                let instanceInvokeExpr = stmts[i].getInvokeExpr() as ArkInstanceInvokeExpr;
                if ('constructor' == instanceInvokeExpr.getMethodSignature().getMethodSubSignature().getMethodName()) {
                    let localName = instanceInvokeExpr.getBase().getName();
                    let newExprIdx = findNewExpr(i, localName);
                    if (newExprIdx >= 0 && newExprIdx < i -1) {
                        moveStmt(i, newExprIdx);
                    }
                }
            }
        }
        return stmts;

        function findNewExpr(constructorIdx: number, name: string): number {
            for (let j = constructorIdx - 1; j >= 0; j--) {
                if (stmts[j] instanceof ArkAssignStmt) {
                    if ((stmts[j] as ArkAssignStmt).getLeftOp() instanceof Local) {
                        if (((stmts[j] as ArkAssignStmt).getLeftOp() as Local).getName() == name) {
                            return j;
                        }
                    }
                }
            }
            return -1;
        }

        function moveStmt(constructorIdx: number, newExprIdx: number): void {
            let back = stmts[newExprIdx];
            for (let i = newExprIdx; i < constructorIdx - 1; i++) {
                stmts[i] = stmts[i + 1];
            }
            stmts[constructorIdx - 1] = back;
        }
    }
}

export class StmtReader {
    private stmts: Stmt[] = [];
    private pos: number;

    constructor(stmts: Stmt[]) {
        this.stmts = stmts;
        this.pos = 0;
    }

    hasNext(): boolean {
        return this.pos < this.stmts.length;
    }

    next(): Stmt {
        if (!this.hasNext()) {
            throw new Error('No more stmt.');
        }
        let stmt = this.stmts[this.pos];
        this.pos++;
        return stmt;
    }

    rollback(): void {
        if (this.pos == 0) {
            throw new Error('No more stmt to rollback.');
        }
        this.pos--;
    }
}