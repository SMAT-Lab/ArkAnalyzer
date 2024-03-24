import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { AbstractInvokeExpr } from "../src/core/base/Expr";
import { CallableType } from "../src/core/base/Type";
import { ArkMethod } from "../src/core/model/ArkMethod";
import { ClassSignature } from "../src/core/model/ArkSignature";
const fs = require('fs');

export class CfgTest {
    private scene: Scene | null = null;

    public buildScene(): Scene {
        // tests\\resources\\cfg\\sample
        // tests\\resources\\cfg\\temp
        // D:\\Codes\\resources\\SE4OpenHarmony-main
        const config_path = "tests\\resources\\cfg\\CfgTestConfig.json";
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson(config_path);
        return new Scene(config);
    }

    public testThreeAddresStmt() {
        let scene = this.buildScene();
        scene.inferTypes();

        for (const arkFile of scene.arkFiles) {
            console.log('=============== arkFile:', arkFile.getName(), ' ================');
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    if (arkMethod.getName() == '_DEFAULT_ARK_METHOD') {
                        continue;
                    }
                    let arkBody = arkMethod.getBody()
                    console.log('*** arkMethod: ', arkMethod.getName());
                    console.log('-- origalstmts:');

                    let originalCfg = arkBody.getOriginalCfg();
                    for (const origalstmt of originalCfg.getStmts()) {
                        console.log(origalstmt.toString());
                        // console.log(origalstmt.toString()+', pos: '+origalstmt.getPositionInfo());
                    }
                    console.log();
                    console.log('-- threeAddresStmts:');
                    let cfg = arkBody.getCfg();
                    for (const threeAddresStmt of cfg.getStmts()) {
                        console.log(threeAddresStmt.toString());
                        // console.log(threeAddresStmt.toString(), ', original pos:', threeAddresStmt.getOriginPositionInfo(),
                        //     ', pos:', threeAddresStmt.getPositionInfo());
                        // console.log('- use');

                        // console.log(threeAddresStmt.getUses());

                    }

                    console.log('-- locals:');
                    for (const local of arkMethod.getBody().getLocals()) {
                        console.log(local.toString());
                    }
                    console.log();
                }
            }
        }
    }


    public testBlocks() {
        let scene = this.buildScene();

        for (const arkFile of scene.arkFiles) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    console.log('************ arkMethod:', arkMethod.getSignature().toString(), ' **********');
                    console.log('StartingBlock:', arkMethod.getBody().getCfg().getStartingBlock());
                }
            }
        }
    }

    public testHilogCallChain() {
        let scene = this.buildScene();
        scene.inferTypes();

        const arkFile = scene.getFiles().find(file => file.getName() == 'sample\\cfgmain.ts');
        if (arkFile) {
            const classSignatureBar = new ClassSignature();
            classSignatureBar.setDeclaringFileSignature(arkFile.getFileSignature());
            classSignatureBar.setClassName('Bar');
            console.log(`classSignatureBar: ${classSignatureBar}`);
            const arkClass = scene.getClass(classSignatureBar);
            if (arkClass == null) {
                console.error(`can't find arkClass Bar`);
                return;
            }

            const arkMethod = arkClass.getMethods().find(method => method.getName() == 'uesStatic');
            if (arkMethod == undefined) {
                console.error(`can't find arkMethod uesStatic`);
                return;
            }

            const cfg = arkMethod.getBody().getCfg();
            for (const stmt of cfg.getStmts()) {
                const invokeExpr = stmt.getInvokeExpr();
                if (invokeExpr && invokeExpr.toString().includes('OnTouch')) {
                    this.hasHilogChain(invokeExpr, scene);
                }
            }
        }
    }

    public testHilogCallChainAll() {
        let scene = this.buildScene();
        scene.inferTypes();

        let hilogCallChainCnt = 0;
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    const cfg = arkMethod.getBody().getCfg();
                    for (const stmt of cfg.getStmts()) {
                        const invokeExpr = stmt.getInvokeExpr();
                        if (invokeExpr && this.isHighFrequencyMethod(invokeExpr.toString()) &&
                            this.hasHilogChain(invokeExpr, scene)) {
                            hilogCallChainCnt += 1;
                        }
                    }
                }
            }
        }
        console.log(`there are ${hilogCallChainCnt} hilog calls in high frequency method.`);

    }

    private isHighFrequencyMethod(methodStr: string): boolean {
        const frequencyMethodList = ['OnTouch'];
        for (const frequencyMethod of frequencyMethodList) {
            if (methodStr.includes(frequencyMethod)) {
                return true;
            }
        }
        return false;
    }

    private hasHilogChain(invokeExpr: AbstractInvokeExpr, scene: Scene): boolean {
        const paraType = invokeExpr.getArg(0).getType();
        if (!(paraType instanceof CallableType)) {
            console.error(`para type of OnTouch is not CallableType`);
            return false;
        }

        const startMethodSignature = paraType.getMethodSignature();
        const startMethod = scene.getMethod(startMethodSignature);
        if (startMethod == null) {
            console.error(`can't find calleeMethod, startMethodSignature is ${startMethodSignature.toString()}`);
            return false;
        }

        const callChain: AbstractInvokeExpr[] = [];  // 数组元素改成invokeExpr
        if (this.findHilog(startMethod, callChain, invokeExpr, scene)) {
            console.log(`** find hilog, call chain is [${callChain.join(' -> ')}]`);
            return true;
        }
        return false
    }

    private findHilog(arkMethod: ArkMethod, callChain: AbstractInvokeExpr[], invokeExpr: AbstractInvokeExpr, scene: Scene): boolean {
        callChain.push(invokeExpr);
        let cfg = arkMethod.getBody().getCfg();
        for (const stmt of cfg.getStmts()) {
            const invokeExpr = stmt.getInvokeExpr();
            if (invokeExpr) {
                const calleeMethodSignature = invokeExpr.getMethodSignature();
                // console.log(`calleeMethodSignature is ${calleeMethodSignature.toString()}`)

                if (invokeExpr.toString().includes('hilog') || invokeExpr.toString().includes('console')) {
                    callChain.push(invokeExpr);
                    return true;
                }


                const calleeMethod = scene.getMethod(calleeMethodSignature);
                if (calleeMethod == null) {
                    console.error(`can't find calleeMethod, calleeMethodSignature is ${calleeMethodSignature.toString()}`);
                    continue;
                }
                if (this.findHilog(calleeMethod as ArkMethod, callChain, invokeExpr, scene)) {
                    return true;
                }
            }
        }
        callChain.pop();
        return false;
    }
}



let cfgTest = new CfgTest();
// cfgTest.buildScene();
// cfgTest.testThreeAddresStmt();
// cfgTest.testBlocks();
// cfgTest.testHilogCallChain();
cfgTest.testHilogCallChainAll();

debugger