import { ArkFile, buildArkFileFromFile } from '../src/core/model/ArkFile';

let file=new ArkFile()
buildArkFileFromFile('D:\\11study\\ArkAnalyzer\\tests\\resources\\cfg\\t\\t.ts',"D:\\11study\\ArkAnalyzer",file)
for(let clas of file.getClasses()){
    if(clas.getName()=='_DEFAULT_ARK_CLASS'){
        for(let method of clas.getMethods()){
            // if(method.getName()=='_DEFAULT_ARK_METHOD'){
                let body=method.getBody();
                let cfg=body.getCfg();
                // cfg.typeReference();
                logger.info(1)
            // }
        }
    }
}
logger.info(1);


// let fileContent = fs.readFileSync('tests\\resources\\cfg\\main.ts', 'utf8');
// let ast:ASTree=new ASTree(fileContent);
// ast.simplify(ast.root);
// // logger.info(ast.root.text)
// let cfgBuilder:CfgBuilder=new CfgBuilder(ast.root,"main",null);

// let cfg=cfgBuilder.buildCfg();
// cfg.buildDefUseChain();
// logger.info(1)


// cfg.printThreeAddressStrs();
// cfg.printThreeAddressStmts();



// cfg.printThreeAddressStrsAndStmts();


debugger
