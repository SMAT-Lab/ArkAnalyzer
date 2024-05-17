import { Stmt } from "../base/Stmt";
import { Fact } from "./Fact";


export class DataflowResult {
    stmt2InFacts!: Map<Stmt, Fact>;
    stmt2OutFacts!: Map<Stmt, Fact>;

    //should we specifically keep global facts or just embedding them into the two maps above
    globalFacts: Set<Fact>;
}