let text = "";
if (this.declaringClass?.declaringArkFile) {
    text += this.declaringClass.declaringArkFile.name + "\n";
}
for (let bi = 0; bi < this.blocks.length; bi++) {
    let block = this.blocks[bi];
    if (bi != 0)
        text += "label" + block.id + ":\n";
    let length = block.stms.length
    for (let i = 0; i < length; i++) {
        let stm = block.stms[i];
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            if (!cstm.nextF.block || !cstm.nextT.block) {
                this.errorTest(cstm);
                return;
            }
            stm.code = "if !(" + cstm.condition + ") goto label" + cstm.nextF.block.id
            // text+="    if !("+cstm.condition+") goto label"+cstm.nextF.block.id+'\n';
            if (i == length - 1 && bi + 1 < this.blocks.length && this.blocks[bi + 1].id != cstm.nextT.block.id) {
                let gotoStm = new StatementBuilder("gotoStatement", "goto label" + cstm.nextT.block.id, null, block.stms[0].scopeID);
                block.stms.push(gotoStm);
                length++;
            }
            // text+="    goto label"+cstm.nextT.block.id+'\n'
        }
        else if (stm.type == "breakStatement" || stm.type == "continueStatement") {
            if (!stm.next?.block) {
                this.errorTest(stm);
                return;
            }
            stm.code = "goto label" + stm.next?.block.id;
        }
        else {
            // text+="    "+block.stms[i].code+'\n';
            if (i == length - 1 && stm.next?.block && (bi + 1 < this.blocks.length && this.blocks[bi + 1].id != stm.next.block.id || bi + 1 == this.blocks.length)) {
                let gotoStm = new StatementBuilder("StatementBuilder", "goto label" + stm.next?.block.id, null, block.stms[0].scopeID);
                block.stms.push(gotoStm);
                length++;
            }
            // text+="    goto label"+stm.next?.block.id+'\n';
        }
        // text+="    "+stm.code+"\n";
        if (stm.addressCode3.length == 0) {
            text += "    " + stm.code + "\n";
        }
        else {
            for (let ac of stm.addressCode3) {
                if (ac.startsWith("if") || ac.startsWith("while")) {
                    let cstm = stm as ConditionStatementBuilder;
                    let condition = ac.substring(ac.indexOf("("));
                    let goto = "";
                    if (cstm.nextF?.block)
                        goto = "if !" + condition + " goto label" + cstm.nextF?.block.id;
                    stm.addressCode3[stm.addressCode3.indexOf(ac)] = goto;
                    text += "    " + goto + "\n";
                }
                else
                    text += "    " + ac + "\n";
            }
        }
        if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let cas of sstm.cases) {
                if (cas.stm.block)
                    text += "        " + cas.value + "goto label" + cas.stm.block.id + '\n';
            }
            if (sstm.default?.block)
                text += "        default : goto label" + sstm.default?.block.id + '\n';
        }
    }

}
for (let cat of this.catches) {
    text += "catch " + cat.errorName + " from label " + cat.from + " to label " + cat.to + " with label" + cat.withLabel + "\n";
}
console.log(text);