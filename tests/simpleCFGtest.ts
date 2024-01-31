import {NodeA,ASTree} from '../src/core/base/Ast';
import {CfgBuilder} from '../src/core/common/CfgBuilder';
import * as fs from 'fs';
import { ArkFile } from '../src/core/model/ArkFile';

let file=new ArkFile()
file.buildArkFileFromSourceFile('tests\\resources\\cfg\\main.ts',"D:\\11study\\ArkAnalyzer")
for(let clas of file.getClasses()){
    if(clas.getName()=='_DEFAULT_ARK_CLASS'){
        for(let method of clas.getMethods()){
            if(method.getName()=='_DEFAULT_ARK_METHOD'){
                let body=method.getBody();
                let cfg=body.getCfg();
                cfg.typeReference();
                console.log(1)
            }
        }
    }
}
console.log(1);


// let fileContent = fs.readFileSync('tests\\resources\\cfg\\main.ts', 'utf8');
// let ast:ASTree=new ASTree(fileContent);
// ast.simplify(ast.root);
// // console.log(ast.root.text)
// let cfgBuilder:CfgBuilder=new CfgBuilder(ast.root,"main",null);

// let cfg=cfgBuilder.buildCfg();
// cfg.buildDefUseChain();
// console.log(1)


// cfg.printThreeAddressStrs();
// cfg.printThreeAddressStmts();



// cfg.printThreeAddressStrsAndStmts();


debugger
