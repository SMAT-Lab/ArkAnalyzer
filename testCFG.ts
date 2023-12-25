import {NodeA,ASTree} from './core/base/Ast';
import {CFG} from './core/base/Cfg';
import * as fs from 'fs';

let fileContent = fs.readFileSync('t.ts', 'utf8');
let ast:ASTree=new ASTree(fileContent);
console.log(ast.root.text)
let cfg:CFG=new CFG(ast.root,"main");
cfg.resetWalked(cfg.entry);
// cfg.simplify();
ast.text=ast.root.text;
cfg=new CFG(ast.root,"main");
// let stms=cfg.getStatementByText("let x=1;");
// if(!(stms&&stms?.length>0))
//     process.exit()
// for(let s of stms){
//     cfg.insertStatementAfter(s,"x++;");
//     cfg.insertStatementBefore(s,"x--;");
// }
cfg.generateDot()
console.log(ast.root.text)