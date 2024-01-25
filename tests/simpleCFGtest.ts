import {NodeA,ASTree} from '../src/core/base/Ast';
import {CfgBuilder} from '../src/core/common/CfgBuilder';
import * as fs from 'fs';

let fileContent = fs.readFileSync('tests\\resources\\cfg\\main.ts', 'utf8');
let ast:ASTree=new ASTree(fileContent);
ast.simplify(ast.root);
// console.log(ast.root.text)
let cfgBuilder:CfgBuilder=new CfgBuilder(ast.root,"main",null);

let cfg=cfgBuilder.buildCfg();
cfg.buildDefUseChain();
console.log(1)


// cfg.printThreeAddressStrs();
// cfg.printThreeAddressStmts();



// cfg.printThreeAddressStrsAndStmts();


debugger

