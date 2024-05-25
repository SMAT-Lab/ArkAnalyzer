if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Parent_Params {
    label?: string;
}
interface HelloGrandsonComponent_Params {
    message?: string;
}
interface HelloChildComponent_Params {
    message?: string;
}
interface HelloComponent_Params {
    message?: string;
}
interface Parent_Params {
    label?: string;
}
interface Parent_Params {
    label?: string;
}
interface HelloComponent_Params {
    message?: string;
}
interface Parent_Params {
    label?: string;
}
namespace Case1 {
    class Tmp {
        paramA1: string = '';
    }
    function overBuilder(params: Tmp, parent = null) {
        const __params__ = params;
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, params = __params__) => {
            Row.create();
        }, Row);
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, params = __params__) => {
            Text.create(`UseStateVarByReference: ${params.paramA1} `);
        }, Text);
        Text.pop();
        Row.pop();
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.__label = new ObservedPropertySimplePU('Hello', this, "label");
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Parent_Params) {
            if (params.label !== undefined) {
                this.label = params.label;
            }
        }
        updateStateVars(params: Parent_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
            this.__label.purgeDependencyOnElmtId(rmElmtId);
        }
        aboutToBeDeleted() {
            this.__label.aboutToBeDeleted();
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private __label: ObservedPropertySimplePU<string>;
        get label() {
            return this.__label.get();
        }
        set label(newValue: string) {
            this.__label.set(newValue);
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            // Pass the this.label reference to the overBuilder component when the overBuilder component is called in the Parent component.
            overBuilder.bind(this)(makeBuilderParameterProxy("overBuilder", { paramA1: () => (this["__label"] ? this["__label"] : this["label"]) }), this);
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Button.createWithLabel('Click me');
                Button.onClick(() => {
                    // After Click me is clicked, the UI text changes from Hello to ArkUI.
                    this.label = 'ArkUI';
                });
            }, Button);
            Button.pop();
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
namespace Case2 {
    class Tmp {
        paramA1: string = '';
    }
    function overBuilder($$: Tmp, parent = null) {
        const __$$__ = $$;
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            Row.create();
        }, Row);
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            Column.create();
        }, Column);
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            Text.create(`overBuilder===${$$.paramA1}`);
        }, Text);
        Text.pop();
        {
            (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
                if (isInitialRender) {
                    let componentCall = new HelloComponent(parent ? parent : this, { message: $$.paramA1 }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/Builder.ets", line: 38, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            message: $$.paramA1
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {
                        message: $$.paramA1
                    });
                }
            }, { name: "HelloComponent" });
        }
        Column.pop();
        Row.pop();
    }
    class HelloComponent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.__message = new SynchedPropertySimpleTwoWayPU(params.message, this, "message");
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: HelloComponent_Params) {
        }
        updateStateVars(params: HelloComponent_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
            this.__message.purgeDependencyOnElmtId(rmElmtId);
        }
        aboutToBeDeleted() {
            this.__message.aboutToBeDeleted();
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private __message: SynchedPropertySimpleTwoWayPU<string>;
        get message() {
            return this.__message.get();
        }
        set message(newValue: string) {
            this.__message.set(newValue);
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Row.create();
            }, Row);
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Text.create(`HelloComponent===${this.message}`);
            }, Text);
            Text.pop();
            Row.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.__label = new ObservedPropertySimplePU('Hello', this, "label");
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Parent_Params) {
            if (params.label !== undefined) {
                this.label = params.label;
            }
        }
        updateStateVars(params: Parent_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
            this.__label.purgeDependencyOnElmtId(rmElmtId);
        }
        aboutToBeDeleted() {
            this.__label.aboutToBeDeleted();
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private __label: ObservedPropertySimplePU<string>;
        get label() {
            return this.__label.get();
        }
        set label(newValue: string) {
            this.__label.set(newValue);
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            // Pass the this.label reference to the overBuilder component when the overBuilder component is called in the Parent component.
            overBuilder.bind(this)(makeBuilderParameterProxy("overBuilder", { paramA1: () => (this["__label"] ? this["__label"] : this["label"]) }), this);
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Button.createWithLabel('Click me');
                Button.onClick(() => {
                    // After Click me is clicked, the UI text changes from Hello to ArkUI.
                    this.label = 'ArkUI';
                });
            }, Button);
            Button.pop();
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
namespace Case3 {
    function overBuilder(paramA1: string, parent = null) {
        const __paramA1__ = paramA1;
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, paramA1 = __paramA1__) => {
            Row.create();
        }, Row);
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, paramA1 = __paramA1__) => {
            Text.create(`UseStateVarByValue: ${paramA1} `);
        }, Text);
        Text.pop();
        Row.pop();
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.__label = new ObservedPropertySimplePU('Hello', this, "label");
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Parent_Params) {
            if (params.label !== undefined) {
                this.label = params.label;
            }
        }
        updateStateVars(params: Parent_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
            this.__label.purgeDependencyOnElmtId(rmElmtId);
        }
        aboutToBeDeleted() {
            this.__label.aboutToBeDeleted();
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private __label: ObservedPropertySimplePU<string>;
        get label() {
            return this.__label.get();
        }
        set label(newValue: string) {
            this.__label.set(newValue);
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            overBuilder.bind(this)(this.label, this);
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
class Tmp {
    paramA1: string = '';
}
function parentBuilder($$: Tmp, parent = null) {
    const __$$__ = $$;
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Row.create();
    }, Row);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Column.create();
    }, Column);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Text.create(`parentBuilder===${$$.paramA1}`);
        Text.fontSize(30);
        Text.fontWeight(FontWeight.Bold);
    }, Text);
    Text.pop();
    {
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            if (isInitialRender) {
                let componentCall = new HelloComponent(parent ? parent : this, { message: $$.paramA1 }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/Builder.ets", line: 99, col: 7 });
                ViewPU.create(componentCall);
                let paramsLambda = () => {
                    return {
                        message: $$.paramA1
                    };
                };
                componentCall.paramsGenerator_ = paramsLambda;
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {
                    message: $$.paramA1
                });
            }
        }, { name: "HelloComponent" });
    }
    childBuilder.bind(this)(makeBuilderParameterProxy("childBuilder", { paramA1: () => ($$["__paramA1"] ? $$["__paramA1"] : $$["paramA1"]) }), parent ? parent : this);
    Column.pop();
    Row.pop();
}
class HelloComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__message = new SynchedPropertySimpleOneWayPU(params.message, this, "message");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HelloComponent_Params) {
        if (params.message === undefined) {
            this.__message.set('');
        }
    }
    updateStateVars(params: HelloComponent_Params) {
        this.__message.reset(params.message);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__message.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__message.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __message: SynchedPropertySimpleOneWayPU<string>;
    get message() {
        return this.__message.get();
    }
    set message(newValue: string) {
        this.__message.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`HelloComponent===${this.message}`);
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function childBuilder($$: Tmp, parent = null) {
    const __$$__ = $$;
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Row.create();
    }, Row);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Column.create();
    }, Column);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Text.create(`childBuilder===${$$.paramA1}`);
        Text.fontSize(30);
        Text.fontWeight(FontWeight.Bold);
    }, Text);
    Text.pop();
    {
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            if (isInitialRender) {
                let componentCall = new HelloChildComponent(parent ? parent : this, { message: $$.paramA1 }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/Builder.ets", line: 125, col: 7 });
                ViewPU.create(componentCall);
                let paramsLambda = () => {
                    return {
                        message: $$.paramA1
                    };
                };
                componentCall.paramsGenerator_ = paramsLambda;
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
            }
        }, { name: "HelloChildComponent" });
    }
    grandsonBuilder.bind(this)(makeBuilderParameterProxy("grandsonBuilder", { paramA1: () => ($$["__paramA1"] ? $$["__paramA1"] : $$["paramA1"]) }), parent ? parent : this);
    Column.pop();
    Row.pop();
}
class HelloChildComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__message = new ObservedPropertySimplePU('', this, "message");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HelloChildComponent_Params) {
        if (params.message !== undefined) {
            this.message = params.message;
        }
    }
    updateStateVars(params: HelloChildComponent_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__message.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__message.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __message: ObservedPropertySimplePU<string>;
    get message() {
        return this.__message.get();
    }
    set message(newValue: string) {
        this.__message.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`HelloChildComponent===${this.message}`);
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function grandsonBuilder($$: Tmp, parent = null) {
    const __$$__ = $$;
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Row.create();
    }, Row);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Column.create();
    }, Column);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
        Text.create(`grandsonBuilder===${$$.paramA1}`);
        Text.fontSize(30);
        Text.fontWeight(FontWeight.Bold);
    }, Text);
    Text.pop();
    {
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            if (isInitialRender) {
                let componentCall = new HelloGrandsonComponent(parent ? parent : this, { message: $$.__paramA1 }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/Builder.ets", line: 149, col: 7 });
                ViewPU.create(componentCall);
                let paramsLambda = () => {
                    return {
                        message: $$.paramA1
                    };
                };
                componentCall.paramsGenerator_ = paramsLambda;
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
            }
        }, { name: "HelloGrandsonComponent" });
    }
    Column.pop();
    Row.pop();
}
class HelloGrandsonComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__message = new SynchedPropertySimpleTwoWayPU(params.message, this, "message");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: HelloGrandsonComponent_Params) {
    }
    updateStateVars(params: HelloGrandsonComponent_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__message.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__message.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __message: SynchedPropertySimpleTwoWayPU<string>;
    get message() {
        return this.__message.get();
    }
    set message(newValue: string) {
        this.__message.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`HelloGrandsonComponent===${this.message}`);
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class Parent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__label = new ObservedPropertySimplePU('Hello', this, "label");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Parent_Params) {
        if (params.label !== undefined) {
            this.label = params.label;
        }
    }
    updateStateVars(params: Parent_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__label.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__label.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __label: ObservedPropertySimplePU<string>;
    get label() {
        return this.__label.get();
    }
    set label(newValue: string) {
        this.__label.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        parentBuilder.bind(this)(makeBuilderParameterProxy("parentBuilder", { paramA1: () => (this["__label"] ? this["__label"] : this["label"]) }), this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('Click me');
            Button.onClick(() => {
                this.label = 'ArkUI';
            });
        }, Button);
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new Parent(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
