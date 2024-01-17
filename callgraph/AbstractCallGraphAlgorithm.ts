import {ClassSignature, MethodSignature} from "../core/ArkSignature";
import {CFG} from "../core/base/Cfg";
import {ArkMethod} from "../core/ArkMethod";
import {Scene} from "../Scene";
import {ArkClass} from "../core/ArkClass";
import {isItemRegistered, MethodSignatureManager, SceneManager} from "./utils";

export abstract class AbstractCallGraphAlgorithm {
    private methods: Set<string>;
    private calls: Map<string, string[]>;
    private _signatureManager: MethodSignatureManager;

    get signatureManager(): MethodSignatureManager {
        return this._signatureManager;
    }

    private _scene: SceneManager;

    get scene(): SceneManager {
        return this._scene;
    }

    public initialize(scene: Scene): void {
        this.methods = new Set<string>();
        this.calls = new Map<string, string[]>();
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
            }
            // 当前函数标记为已处理
            this.signatureManager.addToProcessedList(methodSignature);
        }
    }

    /**
     * Parse the body of the specific method to obtain the call relationships within the method.
     *
     * @param sourceMethodSignature
     */
    public processMethod(sourceMethodSignature: MethodSignature): MethodSignature[] {
        let cfg: CFG = this.scene.getMethod(sourceMethodSignature).getCFG();
        let invocationTargets: MethodSignature[]
        for (let stmt of cfg.statementArray) {
            // TODO: 接入Stmt判断
            if (stmt) {
                // Process the invocation statement using CHA (Class Hierarchy Analysis) and RTA (Rapid Type Analysis).
                invocationTargets = this.resolveCall(sourceMethodSignature, stmt)
            }
        }
        return invocationTargets
    }

    protected abstract resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[];

    protected abstract preProcessMethod(methodSignature: MethodSignature): void;

    protected addMethod(method: MethodSignature): void {
        this.methods.add(method.toString());
    }

    protected hasMethod(method: MethodSignature): boolean {
        return this.methods.has(method.toString());
    }

    protected addCall(source: MethodSignature, target: MethodSignature): void {
        if (this.calls.has(source.toString())) {
            // for (let call of this.calls.get())
            if (!isItemRegistered<string>(
                target.toString(), this.calls.get(source.toString()),
                (a, b) =>
                    a === b
            )) {
                this.calls.get(source.toString()).push(target.toString());
            }
        } else {
            this.calls.set(source.toString(), [target.toString()]);
        }
    }

    protected getCall(source: MethodSignature): string[] {
        return this.calls.get(source.toString());
    }
}