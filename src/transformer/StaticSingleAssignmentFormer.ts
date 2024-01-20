import { ArkPhiExpr } from "../core/base/Expr";
import { Local } from "../core/base/Local";
import { ArkAssignStmt, Stmt } from "../core/base/Stmt";
import { BasicBlock } from "../core/graph/BasicBlock";
import { Cfg } from "../core/graph/Cfg";
import { DominanceFinder } from "../core/graph/DominanceFinder";
import { DominanceTree } from "../core/graph/DominanceTree";
import { ArkBody } from "../core/model/ArkBody";


export class StaticSingleAssignmentFormer {
    public transformBody(body: ArkBody) {
        let cfg = body.getCfg();

        let blockToDefs = new Map<BasicBlock, Set<Local>>();
        let localToBlocks = new Map<Local, Set<BasicBlock>>();
        for (const blcok of cfg.getBlocks()) {
            let defs = new Set<Local>();
            for (const stmt of blcok.getStmts()) {
                if (stmt.getDef() != null && stmt.getDef() instanceof Local) {
                    let local = stmt.getDef() as Local;
                    defs.add(local);
                    if (localToBlocks.has(local)) {
                        localToBlocks.get(local)?.add(blcok);
                    } else {
                        let blcoks = new Set<BasicBlock>();
                        blcoks.add(blcok);
                        localToBlocks.set(local, blcoks);
                    }
                }
            }
            blockToDefs.set(blcok, defs);
        }

        let dominanceFinder = new DominanceFinder(cfg);
        let blockToPhiStmts = this.decideBlockToPhiStmts(body, dominanceFinder, blockToDefs, localToBlocks);
        this.addPhiStmts(blockToPhiStmts, cfg, blockToDefs);
        let dominanceTree = new DominanceTree(dominanceFinder);

        this.renameLocals(body, dominanceTree, blockToPhiStmts);
    }


    private decideBlockToPhiStmts(body: ArkBody, dominanceFinder: DominanceFinder,
        blockToDefs: Map<BasicBlock, Set<Local>>, localToBlocks: Map<Local, Set<BasicBlock>>):
        Map<BasicBlock, Set<Stmt>> {
        let blockToPhiStmts = new Map<BasicBlock, Set<Stmt>>();
        let blockToPhiLocals = new Map<BasicBlock, Set<Local>>();
        let localToPhiBlock = new Map<Local, Set<BasicBlock>>();

        for (const local of body.getLocals()) {
            localToPhiBlock.set(local, new Set());
            let phiBlocks = localToPhiBlock.get(local) as Set<BasicBlock>;
            let blocks = Array.from(localToBlocks.get(local) as Set<BasicBlock>);
            while (blocks.length != 0) {
                let block = blocks.splice(0, 1).at(0) as BasicBlock;
                let dfs = dominanceFinder.getDominanceFrontiers(block);
                for (const df of dfs) {
                    if (!phiBlocks.has(df)) {
                        phiBlocks.add(df);

                        let phiStmt = this.createEmptyPhiStmt(local);
                        if (blockToPhiStmts.has(block)) {
                            blockToPhiStmts.get(block)?.add(phiStmt);
                            blockToPhiLocals.get(block)?.add(local);
                        } else {
                            let phiStmts = new Set<Stmt>();
                            phiStmts.add(phiStmt);
                            blockToPhiStmts.set(block, phiStmts);
                            let phiLocals = new Set<Local>();
                            phiLocals.add(local);
                            blockToPhiLocals.set(block, phiLocals);
                        }
                        blockToDefs.get(block)?.add(local);

                        if (!blockToDefs.get(block)?.has(local)) {
                            blocks.push(block);
                        }
                    }
                }
            }
        }

        return blockToPhiStmts;
    }

    private addPhiStmts(blockToPhiStmts: Map<BasicBlock, Set<Stmt>>, cfg: Cfg,
        blockToDefs: Map<BasicBlock, Set<Local>>): void {

        let phiArgsNum = new Map<Stmt, number>();
        for (const block of cfg.getBlocks()) {
            let succs = Array.from(block.getSuccessors());
            for (const succ of succs) {
                if (blockToPhiStmts.has(succ)) {
                    for (const phi of (blockToPhiStmts.get(succ) as Set<Stmt>)) {
                        let local = phi.getDef() as Local;
                        if (blockToDefs.get(block)?.has(local)) {
                            if (phiArgsNum.has(phi)) {
                                let num = phiArgsNum.get(phi) as number;
                                phiArgsNum.set(phi, num);
                            } else {
                                phiArgsNum.set(phi, 1);
                            }
                        }
                    }
                }
            }
        }

        for (const block of blockToPhiStmts.keys()) {
            let phis = blockToPhiStmts.get(block) as Set<Stmt>;
            let phisTocheck = new Set(phis);
            for (const phi of phisTocheck) {
                if ((phiArgsNum.get(phi) as number) < 2) {
                    phis.delete(phi);
                }
            }

            for (const phi of phis) {
                cfg.insertBefore(block.getHead() as Stmt, phi);
            }
        }
    }

    private renameLocals(body: ArkBody, dominanceTree: DominanceTree,
        blockToPhiStmts: Map<BasicBlock, Set<Stmt>>): void {
        let newLocals = new Set(body.getLocals());
        let localToNameStack = new Map<Local, Local[]>();
        for (const local of newLocals) {
            localToNameStack.set(local, new Array<Local>())
        }

        let blockStack = new Array<BasicBlock>();
        let visited = new Set<BasicBlock>();
        let dfsBlocks = dominanceTree.getAllNodesDFS();
        let nextFreeIdx = 0;
        for (const block of dfsBlocks) {
            let newPhiStmts = new Set<Stmt>();
            for (const stmt of block.getStmts()) {
                // rename uses
                let uses = stmt.getUses();
                if (uses.length > 0 && !this.constainsPhiExpr(stmt)) {
                    for (const use of uses) {
                        if (use instanceof Local) {
                            let nameStack = localToNameStack.get(use) as Local[];
                            let newUse = nameStack[nameStack.length - 1];
                            stmt.replaceUse(use, newUse);
                        }
                    }
                }

                // rename def
                let def = stmt.getDef();
                if (def != null && def instanceof Local) {
                    let newName = def.getName() + '#' + nextFreeIdx;
                    nextFreeIdx++;
                    let newDef = new Local(newName);
                    newLocals.add(newDef);
                    localToNameStack.get(def)?.push(newDef);
                    (<ArkAssignStmt>stmt).replaceDef(def, newDef);
                    if (this.constainsPhiExpr(stmt)) {
                        newPhiStmts.add(stmt);
                    }
                }
            }
            visited.add(block);
            blockStack.push(block);
            if (blockToPhiStmts.has(block)) {
                blockToPhiStmts.set(block, newPhiStmts);
            }

            // rename phiStmts' args
            let succs = Array.from(block.getSuccessors());
            for (const succ of succs) {
                if (blockToPhiStmts.has(succ)) {
                    let phiStmts = blockToPhiStmts.get(succ) as Set<Stmt>;
                    for (const phiStmt of phiStmts) {
                        let def = phiStmt.getDef() as Local;
                        let oriDef = this.getOriginalLocal(def, new Set(localToNameStack.keys())) as Local;
                        let nameStack = localToNameStack.get(oriDef) as Local[];
                        let arg = nameStack[nameStack.length - 1];
                        this.addNewArgToPhi(phiStmt, arg, block);
                    }
                }
            }

            // if a block's children in dominance tree are visited, remove it
            let top = blockStack[blockStack.length - 1];
            let children = dominanceTree.getChildren(top);
            while (this.containsAllChildren(visited, children)) {
                blockStack.pop();
                for (const stmt of top.getStmts()) {
                    let def = stmt.getDef();
                    if (def != null && def instanceof Local) {
                        let oriDef = this.getOriginalLocal(def, new Set(localToNameStack.keys())) as Local;
                        localToNameStack.get(oriDef)?.pop();
                    }
                }

                // next block to check
                if (blockStack.length > 0) {
                    top = blockStack[blockStack.length - 1];
                    children = dominanceTree.getChildren(top);
                } else {
                    break;
                }
            }
        }
        body.setLocals(newLocals);
    }

    private constainsPhiExpr(stmt: Stmt): boolean {
        if (stmt instanceof ArkAssignStmt && stmt.getUses().length > 0) {
            for (const use of stmt.getUses()) {
                if (use instanceof ArkPhiExpr) {
                    return true;
                }
            }
        }
        return false;
    }

    private getOriginalLocal(local: Local, locals: Set<Local>): Local | null {
        if (locals.has(local)) {
            return local;
        }
        let hashPos = local.getName().indexOf('#');
        let oriName = local.getName().substring(0, hashPos);
        for (const oriLocal of locals) {
            if (oriLocal.getName() == oriName) {
                return oriLocal;
            }
        }
        return null;
    }

    private addNewArgToPhi(phiStmt: Stmt, arg: Local, block: BasicBlock): void {
        for (let use of phiStmt.getUses()) {
            if (use instanceof ArkPhiExpr) {
                let phiExpr = use as ArkPhiExpr;
                let args = phiExpr.getArgs();
                let argToBlock = phiExpr.getArgToBlock();
                args.push(arg);
                argToBlock.set(arg, block);
                phiExpr.setArgs(args);
                phiExpr.setArgToBlock(argToBlock);
                break;
            }
        }
    }

    private containsAllChildren(blockSet: Set<BasicBlock>, children: BasicBlock[]): boolean {
        for (const child of children) {
            if (!blockSet.has(child)) {
                return false;
            }
        }
        return true;
    }


    // TODO
    private createEmptyPhiStmt(local: Local): ArkAssignStmt {
        let phiExpr = new ArkPhiExpr();
        return new ArkAssignStmt(local, phiExpr);
    }
}