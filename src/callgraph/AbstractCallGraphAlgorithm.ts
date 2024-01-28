import {MethodSignature} from "../core/model/ArkSignature";
import {Scene} from "../Scene";
import {isItemRegistered, MethodSignatureManager, SceneManager} from "../utils/callGraphUtils";
import {Cfg} from "../core/graph/Cfg";
import {ArkInvokeStmt} from "../core/base/Stmt";

export abstract class AbstractCallGraphAlgorithm {
    private methods: Set<string>;
    private calls: Map<string, string[]>;
    private _signatureManager: MethodSignatureManager;

    get signatureManager(): MethodSignatureManager {
        return this._signatureManager;
    }

    private readonly _scene: SceneManager;

    get scene(): SceneManager {
        return this._scene;
    }

    constructor(scene: Scene) {
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
        this.methods.add(method.toString());
    }

    protected hasMethod(method: MethodSignature): boolean {
        return this.methods.has(method.toString());
    }

    protected addCall(source: MethodSignature, target: MethodSignature): void {
        if (this.calls.has(source.toString())) {
            // for (let call of this.calls.get())
            if (!isItemRegistered<string>(
                target.toString(), this.getCall(source),
                (a, b) =>
                    a === b
            )) {
                // @ts-ignore
                this.calls.get(source.toString()).push(target.toString());
            }
        } else {
            this.calls.set(source.toString(), [target.toString()]);
        }
    }

    protected getCall(source: MethodSignature): string[] {
        let targetCalls =  this.calls.get(source.toString());
        if (typeof targetCalls == "undefined")
            return []
        return targetCalls
    }

    public printDetails(): void {
        // 打印 Methods
        console.log('Methods:');
        this.methods.forEach(method => {
            console.log(`    ${method}`);
        });

        // 打印 Calls
        console.log('Calls:');
        // 计算最长的method名称的长度，加上箭头和空格的长度
        const longestCallerLength = Array.from(this.calls.keys()).reduce((max, method) => Math.max(max, method.length), 0);
        const arrow = '->';
        const spacesAfterArrow = '   ';
        const prefixLength = longestCallerLength + arrow.length + spacesAfterArrow.length;

        this.calls.forEach((calledMethods, method) => {
            // 对于每个调用源，只打印一次调用源和第一个目标方法
            const firstMethod = calledMethods[0];
            console.log(`    ${method.padEnd(longestCallerLength)}   ${arrow}   ${firstMethod}`);

            for (let i = 1; i < calledMethods.length; i++) {
                console.log(`       ${' '.repeat(prefixLength)}${calledMethods[i]}`);
            }
        });
    }
}