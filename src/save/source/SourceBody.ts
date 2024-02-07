
import { ArkInstanceInvokeExpr, ArkNewExpr } from '../../core/base/Expr';
import { Local } from "../../core/base/Local";
import { ArkParameterRef } from "../../core/base/Ref";
import { ArkAssignStmt, ArkGotoStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, ArkSwitchStmt, Stmt } from '../../core/base/Stmt';
import { BasicBlock } from "../../core/graph/BasicBlock";
import { DominanceFinder } from "../../core/graph/DominanceFinder";
import { DominanceTree } from "../../core/graph/DominanceTree";
import { ArkBody } from "../../core/model/ArkBody";
import { ArkCodeBuffer } from "../ArkStream";
import { SourceAssignStmt, SourceCaseStmt, SourceCompoundEndStmt, SourceElseStmt, SourceForStmt, SourceGotoStmt, SourceIfStmt, SourceInvokeStmt, SourceReturnStmt, SourceReturnVoidStmt, SourceSwitchStmt, SourceWhileStmt } from './SourceStmt';


export class SourceBody {
    printer: ArkCodeBuffer;
    arkBody: ArkBody;
    isDefault: boolean;
    stmts: Stmt[] = [];
    dominanceTree: DominanceTree;
    
    public constructor(indent: string, arkBody: ArkBody, isDefault: boolean) {
        this.arkBody = arkBody;
        this.isDefault = isDefault;
        this.printer = new ArkCodeBuffer(indent);
        this.dominanceTree = new DominanceTree(new DominanceFinder(arkBody.getCfg()));
        this.buildSourceStmt();
    }

    public dump(): string {
        this.printLocals();
        this.printStmts();

        return this.printer.toString();
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
                let onPath: Set<BasicBlock> = new Set<BasicBlock>();
                let inCycle = this.isInCycle(block, visitor, onPath);
                if (inCycle) {
                    if (stmtReader.hasNext()) {
                        // for (;;) 
                        this.stmts.push(new SourceForStmt(stmt, stmtReader));
                    } else {
                        // while 
                        this.stmts.push(new SourceWhileStmt(stmt, stmtReader));
                    }
                    
                    for (const sub of onPath) {
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
                    if (successorBlocks.length > 1 && !visitor.has(successorBlocks[1])) {
                        // if block dominates successorBlocks[1], than successorBlocks[1] not in branch
                        if (!this.hasDominated(block, successorBlocks[1])) {
                            visitor.add(successorBlocks[1]);
                            this.buildBasicBlock(successorBlocks[1], visitor, stmt);
                        }
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
                    this.stmts.push(new SourceGotoStmt(stmt, stmtReader));
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
            this.printer.writeIndent().write(`let ${local.getName()}`);
            if (local.getType().length > 0) {
                this.printer.write(`: ${local.getType()}`);
            }
            this.printer.writeLine(';');
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

    private isInCycle(block: BasicBlock, visitor: Set<BasicBlock>, onPath: Set<BasicBlock>): boolean {
        let inCycle: boolean = false;
        visitor.delete(block);
        if (block.getSuccessors().length > 0) {
            let next = block.getSuccessors()[0];
            onPath.add(next);
            dfs(next);
        }
        
        function dfs(_block: BasicBlock): void {
            if (_block === block) {
                inCycle = true;
                return;
            }
            for (const sub of _block.getSuccessors()) {
                if (!visitor.has(sub) && !onPath.has(sub)) {
                    onPath.add(sub);
                    dfs(sub);
                }
            }
        }
        visitor.add(block);

        return inCycle;
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