import {MethodSignature} from "../core/ArkSignature";
import {CFG} from "../core/base/Cfg";

export abstract class AbstractCallGraphAlgorithm {
    protected abstract resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[];
    public processWorkList(
        workList: MethodSignature[],
        processed: MethodSignature[],
    ) {
        while (workList.length != 0) {
            let methodSignature = workList.shift();
            if (processed.includes(methodSignature)) {
                continue
            }
            // 获取该function中的调用目标
            let invokeTargets = this.processMethod(methodSignature)
            for (let invokeTarget of invokeTargets) {
                workList.push(invokeTarget);
            }

            processed.push(methodSignature);
        }
    }

    public processMethod(sourceMethodSignature: MethodSignature): MethodSignature[] {
        // TODO: 根据方法签名获取cfg
        let cfg : CFG;
        let invocationTargets : MethodSignature[]
        // TODO: 获取cfg中的语句
        // for (let stmt of cfg.?) {
        //     // TODO: 获取调用语句，并调用相关算法(CHA, RTA)解析调用语句获取调用目标
        //     if (stmt == invokeStmt) {
        //         invocationTargets = this.resolveCall(sourceMethodSignature, stmt)
        //     }
        // }
        return []
    }
}