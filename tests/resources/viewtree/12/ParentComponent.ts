if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface CountDownComponent_Params {
    count?: number;
    costOfOneAttempt?: number;
}
interface ParentComponent_Params {
    countDownStartValue?: number;
}
class ParentComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__countDownStartValue = new ObservedPropertySimplePU(10 // 10 Nuggets default start value in a Game
        , this, "countDownStartValue");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ParentComponent_Params) {
        if (params.countDownStartValue !== undefined) {
            this.countDownStartValue = params.countDownStartValue;
        }
    }
    updateStateVars(params: ParentComponent_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__countDownStartValue.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__countDownStartValue.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __countDownStartValue: ObservedPropertySimplePU<number>; // 10 Nuggets default start value in a Game
    get countDownStartValue() {
        return this.__countDownStartValue.get();
    }
    set countDownStartValue(newValue: number) {
        this.__countDownStartValue.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`Grant ${this.countDownStartValue} nuggets to play.`);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.onClick(() => {
                this.countDownStartValue += 1;
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('+1 - Nuggets in New Game');
        }, Text);
        Text.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.onClick(() => {
                this.countDownStartValue -= 1;
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('-1  - Nuggets in New Game');
        }, Text);
        Text.pop();
        Button.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // when creatng ChildComponent, the initial value of its @Prop variable must be supplied
                    // in a named constructor parameter
                    // also regular costOfOneAttempt (non-Prop) variable is initialied
                    CountDownComponent(this, { count: this.countDownStartValue, costOfOneAttempt: 2 }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/ParentComponent.ets", line: 21, col: 13 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            count: this.countDownStartValue,
                            costOfOneAttempt: 2
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        count: this.countDownStartValue
                    });
                }
            }, { name: "CountDownComponent" });
        }
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class CountDownComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__count = new SynchedPropertySimpleOneWayPU(params.count, this, "count");
        this.costOfOneAttempt = undefined;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CountDownComponent_Params) {
        if (params.costOfOneAttempt !== undefined) {
            this.costOfOneAttempt = params.costOfOneAttempt;
        }
    }
    updateStateVars(params: CountDownComponent_Params) {
        this.__count.reset(params.count);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__count.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__count.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __count: SynchedPropertySimpleOneWayPU<number>;
    get count() {
        return this.__count.get();
    }
    set count(newValue: number) {
        this.__count.set(newValue);
    }
    private costOfOneAttempt: number;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.count > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`You have ${this.count} Nuggets left`);
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('Game over!');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.onClick(() => {
                this.count -= this.costOfOneAttempt;
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Try again');
        }, Text);
        Text.pop();
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new ParentComponent(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
