import { ArkEqExpr } from "../src/core/base/Expr";
import { ArkAssignStmt, ArkGotoStmt, ArkIfStmt, ArkReturnVoidStmt, } from "../src/core/base/Stmt";
import { Local } from "../src/core/comon/Local";
import { LinePosition } from "../src/core/comon/Position";
import { MutableBasicBlock } from "../src/core/base/MutableBasicBlock";
import { MutableBlockStmtGraph } from "../src/core/base/MutableBlockStmtGraph";

class MutableBlockStmtGraphTest {
    /* 3-address code
        a=b;
        if b<c goto L1        
        c=d;
        goto L2
        L1:
            a=c;
        L2:
            return;

    */

    private localA = new Local('a');
    private localB = new Local('b');
    private localC = new Local('c');
    private localD = new Local('d');

    private assign1 = new ArkAssignStmt(this.localA, this.localB, new LinePosition(1));
    private if1 = new ArkIfStmt(new ArkEqExpr(this.localB, this.localC), new LinePosition(2));
    private goto1 = new ArkGotoStmt(new LinePosition(2));
    private assign2 = new ArkAssignStmt(this.localC, this.localD, new LinePosition(3));
    private goto2 = new ArkGotoStmt(new LinePosition(4));
    private assign3 = new ArkAssignStmt(this.localC, this.localD, new LinePosition(6));
    private returnStmt = new ArkReturnVoidStmt(new LinePosition(8));


    public buildGraph(): MutableBlockStmtGraph {
        let gragh = new MutableBlockStmtGraph();

        let blockA = new MutableBasicBlock();
        blockA.addStmt(this.assign1);
        blockA.addStmt(this.if1);
        let blockB = new MutableBasicBlock();
        blockB.addStmt(this.goto1);
        let blockC = new MutableBasicBlock();
        blockC.addStmt(this.assign2);
        blockC.addStmt(this.goto2);
        let blockD = new MutableBasicBlock();
        blockD.addStmt(this.assign3);
        blockD.addStmt(this.returnStmt);

        gragh.putEdge(this.if1, ArkIfStmt.THEN_BRANCH_IDX, this.goto1);
        gragh.putEdge(this.if1, ArkIfStmt.ELSE_BRANCH_IDX, this.assign2);

        gragh.putEdge(this.goto1, ArkGotoStmt.BRANCH_IDX, this.assign3);
        gragh.putEdge(this.goto2, ArkGotoStmt.BRANCH_IDX, this.assign3);

        return gragh;
    }

    public test(): void {
        let gragh = this.buildGraph();
        console.log(gragh);
    }
}


let mutableBlockStmtGraphTest = new MutableBlockStmtGraphTest();
mutableBlockStmtGraphTest.test();

debugger
