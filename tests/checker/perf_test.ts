import { Scene } from "../../src/Scene";
import { ArkMethod } from "../../src/core/model/ArkMethod";
import { Cfg } from "../../src/core/Cfg";
import * as utils from "../../src/utils/getAllFiles";
import * as ts from 'typescript';

let input_dir = '/Users/li.li/Projects/gitee/codelabs/NetworkManagement/NewsDataArkTS'

const projectFiles: string[] = utils.getAllFiles(input_dir, ['.ts']);

console.log(projectFiles.length);

let scene: Scene = new Scene("Performance", projectFiles);

//let method = scene.getMethod('./tests/resources/perf/perf_test.ts', 'test1_2', [], ['GlobalThis'])

let methods = scene.getMethods();
for (let m of methods) {
    console.log(m.methodSubSignature.methodName)
    let cfg = m.getCFG();

    for (let stmt of cfg.statementArray) {
        //console.log(stmt)

        for (let j of stmt.threeAddressStmts) {
            console.log(j)

            
        }
    }
    
    //if (m.methodSubSignature.methodName == 'test1_2') {
        //console.log(m.methodSubSignature.methodName)

        //let cfg: CFG = m.getCFG();
        
        //for (const stmt of cfg.statementArray) {
        //    console.log(stmt)
            

            //if (ts.isPropertyAccessExpression()) {

            //}
        //}
    //}
    
}

//let methods2: ArkMethod[] = scene.getMethodByName('test1_1');
//for (let method of methods2) {
 //   console.log(method.methodSubSignature.methodName)
//}

