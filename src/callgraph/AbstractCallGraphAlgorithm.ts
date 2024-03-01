import {MethodSignature} from "../core/model/ArkSignature";
import {Scene} from "../Scene";
import {isItemRegistered, MethodSignatureManager, SceneManager} from "../utils/callGraphUtils";
import {Cfg} from "../core/graph/Cfg";
import {ArkInvokeStmt} from "../core/base/Stmt";

export abstract class AbstractCallGraphAlgorithm {
    private methods: Set<MethodSignature>;
    private calls: Map<MethodSignature, MethodSignature[]>;
    private _signatureManager: MethodSignatureManager;

    get signatureManager(): MethodSignatureManager {
        return this._signatureManager;
    }

    private readonly _scene: SceneManager;

    get scene(): SceneManager {
        return this._scene;
    }

    constructor(scene: Scene) {
        this.methods = new Set<MethodSignature>();
        this.calls = new Map<MethodSignature, MethodSignature[]>();
        this._signatureManager = new MethodSignatureManager();
        this._scene = new SceneManager();
        this._scene.scene = scene;
    }

    public loadCallGraph(entryPoints: MethodSignature[]) {
        this.processWorkList(entryPoints);
    }

    /**
     * The main processing function of the call graph,
     * traversing the workList to handle function call relationships.
     *
     * @param entryPoints
     */
    public processWorkList(
        entryPoints: MethodSignature[],
    ) {
        this.signatureManager.workList = entryPoints
        while (this.signatureManager.workList.length != 0) {
            let methodSignature = this.signatureManager.workList.shift();
            if (typeof methodSignature == "undefined")
                continue

            if (this.signatureManager.findInProcessedList(methodSignature)) {
                continue
            }
            // 前处理，主要用于RTA
            this.preProcessMethod(methodSignature);
            // 处理该function, method中的调用目标
            let invokeTargets = this.processMethod(methodSignature)
            // 将调用目标加入到workList
            for (let invokeTarget of invokeTargets) {
                this.signatureManager.addToWorkList(invokeTarget);
                this.addCall(methodSignature, invokeTarget)
            }
            // 当前函数标记为已处理
            this.signatureManager.addToProcessedList(methodSignature);
            this.addMethod(methodSignature)
        }
    }

    /**
     * Parse the body of the specific method to obtain the call relationships within the method.
     *
     * @param sourceMethodSignature
     */
    public processMethod(sourceMethodSignature: MethodSignature): MethodSignature[] {
        // let cfg: Cfg = this.scene.getMethod(sourceMethodSignature).getCFG();
        // console.log("CallGraph SourceMethodSignature: "+sourceMethodSignature.toString())
        let invocationTargets: MethodSignature[] = []
        let cfg: Cfg | undefined = this.scene.getMethod(sourceMethodSignature)?.getBody().getCfg()
        if (typeof cfg == "undefined")
            return invocationTargets
        for (let stmt of cfg.getStmts()) {
            if (stmt instanceof ArkInvokeStmt) {
                // Process the invocation statement using CHA (Class Hierarchy Analysis) and RTA (Rapid Type Analysis).
                let invocationTargetsOfSingleMethod = this.resolveCall(sourceMethodSignature, stmt)
                for (let invocationTarget of invocationTargetsOfSingleMethod) {
                    if (!isItemRegistered<MethodSignature>(
                        invocationTarget, invocationTargets,
                        (a, b) =>
                            a.toString() === b.toString()
                    )) {
                        invocationTargets.push(invocationTarget)
                    }
                }
            }
        }
        return invocationTargets
    }

    protected abstract resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[];

    protected abstract preProcessMethod(methodSignature: MethodSignature): void;

    protected addMethod(method: MethodSignature): void {
        this.methods.add(method);
    }

    protected hasMethod(method: MethodSignature): boolean {
        return this.methods.has(method);
    }

    protected addCall(source: MethodSignature, target: MethodSignature): void {
        if (this.calls.has(source)) {
            // for (let call of this.calls.get())
            if (!isItemRegistered<MethodSignature>(
                target, this.getCall(source),
                (a, b) =>
                    a.toString() === b.toString()
            )) {
                // @ts-ignore
                this.calls.get(source).push(target);
            }
        } else {
            this.calls.set(source, [target]);
        }
    }

    protected getCall(source: MethodSignature): MethodSignature[] {
        let targetCalls =  this.calls.get(source);
        if (typeof targetCalls == "undefined")
            return []
        return targetCalls
    }

    public getCalls() {
        return this.calls
    }

    public getMethods() {
        return this.methods
    }

}