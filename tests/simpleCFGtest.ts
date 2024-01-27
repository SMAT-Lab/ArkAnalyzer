import {NodeA,ASTree} from '../src/core/base/Ast';
import {CfgBuilder} from '../src/core/common/CfgBuilder';
import * as fs from 'fs';
import { ArkFile } from '../src/core/model/ArkFile';

// let file=new ArkFile('tests\\resources\\cfg\\main.ts',"D:\\11study\\ArkAnalyzer")
// console.log(1);


// let fileContent = fs.readFileSync('tests\\resources\\cfg\\main.ts', 'utf8');
let fileContent = fs.readFileSync('/Users/yangyizhuo/WebstormProjects/ArkAnalyzer/tests/resources/callgraph/main.ts', 'utf8');
let ast:ASTree=new ASTree(fileContent);
ast.simplify(ast.root);
// // console.log(ast.root.text)
ast.printAST()
// let cfgBuilder:CfgBuilder=new CfgBuilder(ast.root,"main",null);

// let cfg=cfgBuilder.buildCfg();
// cfg.buildDefUseChain();
// console.log(1)


// cfg.printThreeAddressStrs();
// cfg.printThreeAddressStmts();



// cfg.printThreeAddressStrsAndStmts();


debugger

