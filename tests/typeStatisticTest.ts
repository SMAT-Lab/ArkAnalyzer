import {NodeA,ASTree} from '../src/core/base/Ast';
import {CfgBuilder} from '../src/core/common/CfgBuilder';
import * as fs from 'fs';
import {Local} from "../src/core/base/Local";

let fileContent = fs.readFileSync('/Users/yangyizhuo/WebstormProjects/ArkAnalyzer/tests/resources/cfg/t.ts', 'utf8');
let ast:ASTree=new ASTree(fileContent);
ast.simplify(ast.root);
// console.log(ast.root.text)
let cfgBuilder:CfgBuilder=new CfgBuilder(ast.root,"main",null);
let locals = cfgBuilder.getLocals()
let typed = 0, notTyped = 0
for (let local of locals) {
    // console.log(local)
    if (local.getType() === "") {
        notTyped ++
    } else {
        typed ++
    }
}
console.log("have locals: "+locals.length+", locals have type: "+typed+", locals have no type: "+notTyped)
debugger

