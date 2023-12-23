import {MethodSignature} from "../core/ArkSignature";
import {CFG} from "../core/base/Cfg";

export abstract class AbstractCallGraphAlgorithm {
    private methods : Set<MethodSignature>;
    private calls : Map<MethodSignature, MethodSignature[]>;
    private _signatureManager: MethodSignatureManager;

    protected abstract resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[];
    protected abstract preProcessMethod(methodSignature: MethodSignature): void;

    public initialize(): void {
        this.methods = new Set<MethodSignature>();
        this.calls = new Map<MethodSignature, MethodSignature[]>();
        this._signatureManager = new MethodSignatureManager();
    }

    public loadCallGraph(entryPoints: MethodSignature[]) {
        this.processWorkList(entryPoints);
    }

    get signatureManager(): MethodSignatureManager {
        return this._signatureManager;
    }

    protected addMethod(method: MethodSignature): void {
        this.methods.add(method);
    }

    protected hasMethod(method: MethodSignature): boolean {
        return this.methods.has(method);
    }

    protected addCall(source: MethodSignature, target: MethodSignature): void {
        if (this.calls.has(source)) {
            this.calls.get(source).push(target);
        } else {
            this.calls.set(source, [target]);
        }
    }

    protected getCall(source: MethodSignature): MethodSignature[] {
        return this.calls.get(source);
    }

    public processWorkList(
        entryPoints: MethodSignature[],
    ) {
        this.signatureManager.workList = entryPoints
        while (this.signatureManager.workList.length != 0) {
            let methodSignature = this.signatureManager.workList.shift();

            if (this.signatureManager.findInProcessedList(methodSignature)) {
                continue
            }
            this.preProcessMethod(methodSignature);
            // 获取该function中的调用目标
            let invokeTargets = this.processMethod(methodSignature)
            for (let invokeTarget of invokeTargets) {
                this.signatureManager.addToWorkList(invokeTarget);
            }

            this.signatureManager.addToProcessedList(methodSignature);
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

class MethodSignatureManager {
    private _workList: MethodSignature[] = [];
    private _processedList: MethodSignature[] = [];

    get workList(): MethodSignature[] {
        return this._workList;
    }

    set workList(list: MethodSignature[]) {
        this._workList = list;
    }

    get processedList(): MethodSignature[] {
        return this._processedList;
    }

    set processedList(list: MethodSignature[]) {
        this._processedList = list;
    }

    public findInWorkList(signature: MethodSignature): MethodSignature | undefined {
        return this.workList.find(item => item === signature);
    }

    public findInProcessedList(signature: MethodSignature): MethodSignature | undefined {
        return this.processedList.find(item => item === signature);
    }

    public addToWorkList(signature: MethodSignature): void {
        this.workList.push(signature);
    }

    public addToProcessedList(signature: MethodSignature): void {
        this.processedList.push(signature);
    }

    public removeFromWorkList(signature: MethodSignature): void {
        this.workList = this.workList.filter(item => item !== signature);
    }

    public removeFromProcessedList(signature: MethodSignature): void {
        this.processedList = this.processedList.filter(item => item !== signature);
    }
}