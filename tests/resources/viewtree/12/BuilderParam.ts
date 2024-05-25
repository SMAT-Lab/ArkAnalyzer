if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface CustomContainerUser_Params {
    text?: string;
}
interface CustomContainer_Params {
    header?: string;
    closer?: () => void;
}
interface Parent_Params {
    label?: string;
}
interface Child_Params {
    label?: string;
    customBuilderParam?: () => void;
    customOverBuilderParam?: ($$: Tmp) => void;
}
interface Parent_Params {
    label?: string;
}
interface Child_Params {
    label?: string;
    customBuilderParam?: () => void;
    customChangeThisBuilderParam?: () => void;
}
interface Parent_Params {
}
interface Child_Params {
    customBuilderParam?: () => void;
}
namespace Case1 {
    class Child extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.customBuilderParam = this.customBuilder;
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Child_Params) {
            if (params.customBuilderParam !== undefined) {
                this.customBuilderParam = params.customBuilderParam;
            }
        }
        updateStateVars(params: Child_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        customBuilder(parent = null) { }
        // 使用父组件@Builder装饰的方法初始化子组件@BuilderParam
        private __customBuilderParam;
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            this.customBuilderParam.bind(this)(this);
            Column.pop();
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
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Parent_Params) {
        }
        updateStateVars(params: Parent_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        componentBuilder(parent = null) {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Text.create(`Parent builder `);
            }, Text);
            Text.pop();
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
namespace Case2 {
    class Child extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.label = `Child`;
            this.customBuilderParam = this.customBuilder;
            this.customChangeThisBuilderParam = this.customChangeThisBuilder;
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Child_Params) {
            if (params.label !== undefined) {
                this.label = params.label;
            }
            if (params.customBuilderParam !== undefined) {
                this.customBuilderParam = params.customBuilderParam;
            }
            if (params.customChangeThisBuilderParam !== undefined) {
                this.customChangeThisBuilderParam = params.customChangeThisBuilderParam;
            }
        }
        updateStateVars(params: Child_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private label: string;
        customBuilder(parent = null) { }
        customChangeThisBuilder(parent = null) { }
        private __customBuilderParam;
        private __customChangeThisBuilderParam;
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            this.customBuilderParam.bind(this)(this);
            Column.pop();
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
            this.label = `Parent`;
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
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private label: string;
        componentBuilder(parent = null) {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Text.create(`${this.label}`);
            }, Text);
            Text.pop();
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            this.componentBuilder.bind(this)(this);
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
namespace Case3 {
    class Tmp {
        label: string = '';
    }
    function overBuilder($$: Tmp, parent = null) {
        const __$$__ = $$;
        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, $$ = __$$__) => {
            Text.create($$.label);
            Text.width(400);
            Text.height(50);
            Text.backgroundColor(Color.Green);
        }, Text);
        Text.pop();
    }
    class Child extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
            super(parent, __localStorage, elmtId, extraInfo);
            if (typeof paramsLambda === "function") {
                this.paramsGenerator_ = paramsLambda;
            }
            this.label = 'Child';
            this.customBuilderParam = this.customBuilder;
            this.customOverBuilderParam = overBuilder;
            this.setInitiallyProvidedValue(params);
            this.finalizeConstruction();
        }
        setInitiallyProvidedValue(params: Child_Params) {
            if (params.label !== undefined) {
                this.label = params.label;
            }
            if (params.customBuilderParam !== undefined) {
                this.customBuilderParam = params.customBuilderParam;
            }
            if (params.customOverBuilderParam !== undefined) {
                this.customOverBuilderParam = params.customOverBuilderParam;
            }
        }
        updateStateVars(params: Child_Params) {
        }
        purgeVariableDependenciesOnElmtId(rmElmtId) {
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private label: string;
        customBuilder(parent = null) { }
        // 无参数类型，指向的componentBuilder也是无参数类型
        private __customBuilderParam;
        // 有参数类型，指向的overBuilder也是有参数类型的方法
        private __customOverBuilderParam;
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            this.customBuilderParam.bind(this)(this);
            this.customOverBuilderParam.bind(this)(makeBuilderParameterProxy("customOverBuilderParam", { label: () => 'global Builder label' }), this);
            Column.pop();
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
            this.label = 'Parent';
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
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private label: string;
        componentBuilder(parent = null) {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Text.create(`${this.label}`);
            }, Text);
            Text.pop();
        }
        initialRender() {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                Column.create();
            }, Column);
            this.componentBuilder.bind(this)(this);
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
class CustomContainer extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__header = new SynchedPropertySimpleOneWayPU(params.header, this, "header");
        this.closer = this.closerBuilder;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CustomContainer_Params) {
        if (params.header === undefined) {
            this.__header.set('');
        }
        if (params.closer !== undefined) {
            this.closer = params.closer;
        }
    }
    updateStateVars(params: CustomContainer_Params) {
        this.__header.reset(params.header);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__header.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__header.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __header: SynchedPropertySimpleOneWayPU<string>;
    get header() {
        return this.__header.get();
    }
    set header(newValue: string) {
        this.__header.set(newValue);
    }
    closerBuilder(parent = null) { }
    // 使用父组件的尾随闭包{}(@Builder装饰的方法)初始化子组件@BuilderParam
    private __closer;
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.header);
            Text.fontSize(30);
        }, Text);
        Text.pop();
        this.closer.bind(this)(this);
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function specificParam(label1: string, label2: string, parent = null) {
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        Column.create();
    }, Column);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        Text.create(label1);
        Text.fontSize(30);
    }, Text);
    Text.pop();
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        Text.create(label2);
        Text.fontSize(30);
    }, Text);
    Text.pop();
    Column.pop();
}
class CustomContainerUser extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__text = new ObservedPropertySimplePU('header', this, "text");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: CustomContainerUser_Params) {
        if (params.text !== undefined) {
            this.text = params.text;
        }
    }
    updateStateVars(params: CustomContainerUser_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__text.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__text.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __text: ObservedPropertySimplePU<string>;
    get text() {
        return this.__text.get();
    }
    set text(newValue: string) {
        this.__text.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new 
                    // 创建CustomContainer，在创建CustomContainer时，通过其后紧跟一个大括号“{}”形成尾随闭包
                    // 作为传递给子组件CustomContainer @BuilderParam closer: () => void的参数
                    CustomContainer(this, {
                        header: this.text,
                        closer: () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.backgroundColor(Color.Yellow);
                                Column.onClick(() => {
                                    this.text = 'changeHeader';
                                });
                            }, Column);
                            specificParam.bind(this)('testA', 'testB', this);
                            Column.pop();
                        }
                    }, undefined, elmtId, () => { }, { page: "tests/resources/viewtree/BuilderParam.ets", line: 146, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            header: this.text,
                            closer: () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.backgroundColor(Color.Yellow);
                                    Column.onClick(() => {
                                        this.text = 'changeHeader';
                                    });
                                }, Column);
                                specificParam.bind(this)('testA', 'testB', this);
                                Column.pop();
                            }
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        header: this.text
                    });
                }
            }, { name: "CustomContainer" });
        }
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new CustomContainerUser(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
