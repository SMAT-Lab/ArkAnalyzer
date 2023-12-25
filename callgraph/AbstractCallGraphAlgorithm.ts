import {ClassSignature, MethodSignature} from "../core/ArkSignature";
import {CFG} from "../core/base/Cfg";
import {ArkFile} from "../core/ArkFile";
import {ArkMethod} from "../core/ArkMethod";
import {ArkCallExpression} from "../core/base/Expr";
import {isCallStatement} from "../core/base/Stmt";
import {Scene} from "../Scene";
import {ArkClass} from "../core/ArkClass";

export abstract class AbstractCallGraphAlgorithm {
    private methods : Set<string>;
    private calls : Map<string, string[]>;
    private _signatureManager: MethodSignatureManager;
    private _scene: SceneManager;

    protected abstract resolveCall(sourceMethodSignature: MethodSignature, invokeExpression): MethodSignature[];
    protected abstract preProcessMethod(methodSignature: MethodSignature): void;

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

    get signatureManager(): MethodSignatureManager {
        return this._signatureManager;
    }


    get scene(): SceneManager {
        return this._scene;
    }

    protected addMethod(method: MethodSignature): void {
        this.methods.add(method.toString());
    }

    protected hasMethod(method: MethodSignature): boolean {
        return this.methods.has(method.toString());
    }

    protected addCall(source: MethodSignature, target: MethodSignature): void {
        if (this.calls.has(source.toString())) {
            // for (let call of this.calls.get())
            this.calls.get(source.toString()).push(target.toString());
        } else {
            this.calls.set(source.toString(), [target.toString()]);
        }
    }

    protected getCall(source: MethodSignature): string[] {
        return this.calls.get(source.toString());
    }

    // call graph主要处理函数，遍历workList处理函数
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

    // 对具体方法解析其方法体，获取该方法内的调用关系
    public processMethod(sourceMethodSignature: MethodSignature): MethodSignature[] {
        let cfg : CFG = this._scene.getMethod(sourceMethodSignature).cfg;
        let invocationTargets : MethodSignature[]
        for (let stmt of cfg.statementArray) {
            if (isCallStatement(stmt)) {
                // 调用CHA, RTA处理调用语句
                invocationTargets = this.resolveCall(sourceMethodSignature, stmt)
            }
        }
        return invocationTargets
    }
}

class MethodSignatureManager {
    private _workList: MethodSignature[] = [];
    private _processedList: string[] = [];

    get workList(): MethodSignature[] {
        return this._workList;
    }

    set workList(list: MethodSignature[]) {
        this._workList = list;
    }

    get processedList(): string[] {
        return this._processedList;
    }

    set processedList(list: string[]) {
        this._processedList = list;
    }

    public findInWorkList(signature: MethodSignature): MethodSignature | undefined {
        return this.workList.find(item => item === signature);
    }

    public findInProcessedList(signature: MethodSignature): string {
        return this.processedList.find(item => item === signature.toString());
    }

    public addToWorkList(signature: MethodSignature): void {
        this.workList.push(signature);
    }

    public addToProcessedList(signature: MethodSignature): void {
        this.processedList.push(signature.toString());
    }

    public removeFromWorkList(signature: MethodSignature): void {
        this.workList = this.workList.filter(item => item !== signature);
    }

    public removeFromProcessedList(signature: MethodSignature): void {
        this.processedList = this.processedList.filter(item => item !== signature.toString());
    }
}

class SceneManager {
    private _scene: Scene;

    set scene(value: Scene) {
        this._scene = value;
    }

    get scene(): Scene {
        return this._scene;
    }

    public getMethod(method: MethodSignature): ArkMethod | null {
        this._scene.getMethod(method.arkClass.arkFile,
            method.methodSubSignature.methodName,
            method.methodSubSignature.parameters,
            [],
            method.arkClass.classType
            )
        return null;
    }

    public getClass(arkClass: ClassSignature): ArkClass | null {
        return this._scene.getClass(arkClass.arkFile, arkClass.classType)
    }
}