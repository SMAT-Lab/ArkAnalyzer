import { Stmt } from "../base/Stmt";
import { BasicBlock } from "./BasicBlock";
import { DefUseChain } from "../base/DefUseChain";

export class Cfg {
    private blocks: Set<BasicBlock> = new Set();
    private stmtToBlock: Map<Stmt, BasicBlock> = new Map();
    private startingStmt: Stmt = new Stmt();

    private defUseChains: DefUseChain[] = [];

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

    private defUseChain(){
        for(const block of this.blocks){
            for(let stmtIndex=0;stmtIndex<block.getStmts().length;stmtIndex++){
                const stmt=block.getStmts()[stmtIndex];
                for(const value of stmt.getUses()){
                    const name=value.toString();
                    const defStmts:Stmt[]=[];
                    // 判断本block之前有无对应def
                    for(let i=stmtIndex-1;i>=0;i--){
                        const beforeStmt=block.getStmts()[i];
                        if(beforeStmt.getDef()&&beforeStmt.getDef()?.toString()==name){
                            defStmts.push(beforeStmt);
                            break;
                        }
                    }
                    // 本block有对应def直接结束,否则找所有的前序block
                    if(defStmts.length!=0){
                        this.defUseChains.push(new DefUseChain(value,defStmts[0],stmt));
                    }
                    else{
                        const needWalkBlocks=block.getPredecessors();
                        const walkedBlocks=new Set();
                        while(needWalkBlocks.length>0){
                            const predecessor=needWalkBlocks.pop();
                            if(!predecessor){
                                return;
                            }
                            const predecessorStmts=predecessor.getStmts();
                            let predecessorHasDef=false;
                            for(let i=predecessorStmts.length-1;i>=0;i--){
                                const beforeStmt=predecessorStmts[i];
                                if(beforeStmt.getDef()&&beforeStmt.getDef()?.toString()==name){
                                    defStmts.push(beforeStmt);
                                    predecessorHasDef=true;
                                    break;
                                }
                            }
                            if(!predecessorHasDef){
                                for(const morePredecessor of predecessor.getPredecessors()){
                                    if(!walkedBlocks.has(morePredecessor))
                                        needWalkBlocks.unshift(morePredecessor);
                                }
                            }
                            walkedBlocks.add(predecessor);
                        }
                        for(const def of defStmts){
                            this.defUseChains.push(new DefUseChain(value,def,stmt))
                        }
                    }
                }
            }
        }
    }


}