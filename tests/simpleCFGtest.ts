import {NodeA,ASTree} from '../core/base/Ast';
import {CFG} from '../core/base/Cfg';
import * as fs from 'fs';

let fileContent = fs.readFileSync('tests\\resources\\cfg\\main.ts', 'utf8');
let ast:ASTree=new ASTree(fileContent);
ast.simplify(ast.root);
// console.log(ast.root.text)
let cfg:CFG=new CFG(ast.root,"main",null);
// cfg.simplify();
// ast.text=ast.root.text;
// cfg=new CFG(ast.root,"main",null);
// let stms=cfg.getStatementByText("let x=1;");
// if(!(stms&&stms?.length>0))
//     process.exit()
// for(let s of stms){
//     cfg.insertStatementAfter(s,"x++;");
//     cfg.insertStatementBefore(s,"x--;");
// }
// cfg.printBlocks();

// cfg.printOriginStmts();

// cfg.printThreeAddressStrs();
cfg.printThreeAddressStmts();



// cfg.printThreeAddressStrsAndStmts();


debugger

