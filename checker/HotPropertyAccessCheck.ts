import { Scene } from "../Scene";
import { NodeA } from "../core/base/Ast";
import { CFG, Variable, conditionStatement, statement, switchStatement } from "../core/base/Cfg";

let thisScene: Scene;

export function HotPropertyAccessCheck(scene: Scene) {
    thisScene = scene;
    for (let fl of scene.arkFiles) {
        console.log("Current file: ", fl.name);
        for (let cls of fl.classes) {
            for (let mtd of cls.methods) {
                //console.log("Current method signature: ", mtd.methodSignature.toString());
                const cfg = mtd.cfg;
                //clean walked flag
                cfg.resetWalked();
                //find loopstatement of CFG
                for (let stmt of cfg.statementArray) {
                    if (stmt.type == 'loopStatement') {
                        //TBD
                        //handle(stmt, stmt.scopeID, cfg);
                        let nextFirstStmt = (stmt as conditionStatement).nextT;
                        if (nextFirstStmt) {
                            checkStatement(nextFirstStmt, stmt.scopeID, cfg);
                        }
                    }
                }
            }
        }
    }
}

// 
function forInFor(stmtID: number, curScopeID: number, cfg: CFG):Boolean {
    let parentScope = cfg.scopes[stmtID].parent;
    if (parentScope && (parentScope.id == curScopeID)) {
        return false;
    }
    return true;
}

function checkStatement(stmt: statement, curScopeID: number, cfg: CFG) {
    //console.log(stmt.scopeID, curScopeID);
    //console.log(stmt.astNode?.text);
    if ((stmt.type == 'loopStatement') && (stmt.scopeID != curScopeID) && forInFor(stmt.scopeID, curScopeID, cfg)) {
        let nextStmt = (stmt as conditionStatement).nextT;
        if (nextStmt) {
            checkStatement(nextStmt, curScopeID, cfg);
        }
    }
    else if (stmt.type == 'switchStatement') {
        handle(stmt, curScopeID, cfg);
        for (let st of (stmt as switchStatement).nexts) {
            if (st) {
                checkStatement(st, curScopeID, cfg);
            }
        }
    }
    else {
        handle(stmt, curScopeID, cfg);
        if (stmt.next) {
            checkStatement(stmt.next, curScopeID, cfg);
        }
    }
}

function handle(stmt: statement, scopID: number, cfg: CFG) {
    if (stmt.astNode == null) {
        return;
    }
    for (let val of stmt.use) {
        let propertyName = propertyAccessCheck(val.name, stmt.astNode);
        if (propertyName != null) {
            for (let chain of val.defUse) {
                if (chain.use == stmt) {
                    //def is out of loop
                    //debugger;
                    if (!findScope(scopID, chain.def.scopeID, cfg)) {
                        //checkDef2Use(chain.def, val.name, propertyName);
                        console.log("Hot Property Access Found: ");
                        console.log("Line" + stmt.line + ": " + stmt.code);
                        console.log("PropertyAccess value: ", val.name);
                    }
                    //TODO: val++ support

                    // check other use whether implicitly update property
                    //for (let val2 of chain.def.def) {
                    //    if (val2.name == val.name) {
                    //        for (let chain2 of val2.defUse) {
                    //        }
                    //    }
                    //}
                }
            }
        }
    }
}

function propertyCheckBro(stmtNode: NodeA): Boolean {
    if (!stmtNode.parent || stmtNode.parent.children.length == 1) {
        return true;
    }
    else {
        let parentChildren = stmtNode.parent.children;
        for (let i = 0; i < parentChildren.length; i++) {
            if (parentChildren[i] == stmtNode) {
                if (parentChildren[i + 1] && (parentChildren[i + 1].kind == "OpenParenToken")) {
                    return false;
                }
                break;
            }
        }
        return true;
    }
}

function propertyAccessCheck(valName: string, stmtNode: NodeA): string | null {
    //console.log("Yifei-1", valName, stmtNode.text);
    //debugger;
    if (stmtNode.kind == 'PropertyAccessExpression' && stmtNode.children[0].text == valName) {
        //make sure it is calling property
        if (propertyCheckBro(stmtNode)) {
            return stmtNode.children[2].text;
        }
        else {
            return null;
        }
    }
    for (let nd of stmtNode.children) {
        let property = propertyAccessCheck(valName, nd);
        if (property != null) {
            return property;
        }
    }
    return null;
}

// if match return false,
function findScope(loopScopeID: number, defScopeID: number, cfg: CFG): Boolean {
    let parentScope = cfg.scopes[loopScopeID].parent;
    if (loopScopeID == defScopeID) {
        return false;
    }
    else if (parentScope != null) {
        return findScope(parentScope.id, defScopeID, cfg);
    }
    return true;
}

function checkDef2Use(defStmt: statement, valName: string, propertyName: string) {
    //
}