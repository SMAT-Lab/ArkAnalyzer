import { Value } from "./Value"
import { Stmt } from "./Stmt"

export class DefUseChain{
    value:Value;
    def:Stmt;
    use:Stmt;
    constructor(value:Value,def:Stmt,use:Stmt){
        this.value=value;
        this.def=def;
        this.use=use;
    }
}