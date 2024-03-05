import { MethodSignature } from "../core/model/ArkSignature";
import { Scene } from "../Scene";
import { isItemRegistered, MethodSignatureManager, SceneManager } from "../utils/callGraphUtils";
import { Cfg } from "../core/graph/Cfg";
import { ArkInvokeStmt } from "../core/base/Stmt";

export abstract class AbstractCallGraph {
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

            if (!this.checkMethodForAnalysis(methodSignature))
                continue
            // pre process for RTA only
            this.preProcessMethod(methodSignature!);
            // process the function and get the invoke targets of current function
            let invokeTargets = this.processMethod(methodSignature!)
            // add invoke targets to workList
            for (let invokeTarget of invokeTargets) {
                this.signatureManager.addToWorkList(invokeTarget);
                this.addCall(methodSignature!, invokeTarget)
            }
            // mark the current function as Processed
            this.signatureManager.addToProcessedList(methodSignature!);
            this.addMethod(methodSignature!)
        }
    }

    /**
     * Parse the body of the specific method to obtain the call relationships within the method.
     *
     * @param sourceMethodSignature
     */
    public processMethod(sourceMethodSignature: MethodSignature): MethodSignature[] {
        let invocationTargets: MethodSignature[] = []
        let cfg: Cfg | undefined = this.scene.getMethod(sourceMethodSignature)?.getBody().getCfg()
        if (typeof cfg !== "undefined") {
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
        }
        return invocationTargets
    }



    protected abstract resolveCall(sourceMethodSignature: MethodSignature, invokeExpression: ArkInvokeStmt): MethodSignature[];

    protected abstract preProcessMethod(methodSignature: MethodSignature): void;

    protected addMethod(method: MethodSignature): void {
        if (this.getMethod(method) == null) {
            this.methods.add(method);
        }
    }

    protected hasMethod(method: MethodSignature): boolean {
        for (let methodOfList of this.methods) {
            if (method.toString() === methodOfList.toString()) {
                return true
            }
        }
        return false;
    }

    protected addCall(source: MethodSignature, target: MethodSignature): void {
        let targetMethods = this.getCall(source)
        if (targetMethods.length > 0) {
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

    public getCalls() {
        return this.calls
    }

    public getMethods() {
        return this.methods
    }

    public getMethod(analyzedMethod: MethodSignature): MethodSignature | null {
        for (const method of this.methods) {
            if (method.toString() === analyzedMethod.toString()) {
                return method;
            }
        }
        return null;
    }

    public getCall(method: MethodSignature): MethodSignature[] {
        for (const [key, value] of this.calls) {
            if (key.toString() === method.toString()) {
                return value;
            }
        }
        return [];
    }

    protected checkMethodForAnalysis(method: MethodSignature | undefined): Boolean {
        if (typeof method == "undefined")
            return false
        if (this.signatureManager.findInProcessedList(method))
            return false
        const ifProjectMethod = this.scene.scene.arkFiles.some(arkFile =>
            arkFile.getFileSignature().toString() ===
            method.getDeclaringClassSignature().getDeclaringFileSignature().toString()
        )
        return ifProjectMethod
    }
}