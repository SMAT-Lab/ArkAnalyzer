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
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(`UseStateVarByReference: ${params.paramA1} `);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        Row.pop();
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.__label = new ObservedPropertySimplePU('Hello', this, "label");
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Column.create();
                if (!isInitialRender) {
                    Column.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            // Pass the this.label reference to the overBuilder component when the overBuilder component is called in the Parent component.
            overBuilder.bind(this)(makeBuilderParameterProxy("overBuilder", { paramA1: () => (this["__label"] ? this["__label"] : this["label"]) }));
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Button.createWithLabel('Click me');
                Button.onClick(() => {
                    // After Click me is clicked, the UI text changes from Hello to ArkUI.
                    this.label = 'ArkUI';
                });
                if (!isInitialRender) {
                    Button.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
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
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(`overBuilder===${$$.paramA1}`);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        {
            (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    ViewPU.create(new HelloComponent(parent ? parent : this, { message: $$.paramA1 }, undefined, elmtId));
                }
                else {
                    (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {
                        message: $$.paramA1
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        Column.pop();
        Row.pop();
    }
    class HelloComponent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.__message = new SynchedPropertySimpleTwoWayPU(params.message, this, "message");
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Row.create();
                if (!isInitialRender) {
                    Row.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Text.create(`HelloComponent===${this.message}`);
                if (!isInitialRender) {
                    Text.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            Text.pop();
            Row.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.__label = new ObservedPropertySimplePU('Hello', this, "label");
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Column.create();
                if (!isInitialRender) {
                    Column.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            // Pass the this.label reference to the overBuilder component when the overBuilder component is called in the Parent component.
            overBuilder.bind(this)(makeBuilderParameterProxy("overBuilder", { paramA1: () => (this["__label"] ? this["__label"] : this["label"]) }));
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Button.createWithLabel('Click me');
                Button.onClick(() => {
                    // After Click me is clicked, the UI text changes from Hello to ArkUI.
                    this.label = 'ArkUI';
                });
                if (!isInitialRender) {
                    Button.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
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
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(`UseStateVarByValue: ${paramA1} `);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        Row.pop();
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.__label = new ObservedPropertySimplePU('Hello', this, "label");
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Column.create();
                if (!isInitialRender) {
                    Column.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            overBuilder.bind(this)(this.label);
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
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Row.create();
        if (!isInitialRender) {
            Row.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Column.create();
        if (!isInitialRender) {
            Column.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Text.create(`parentBuilder===${$$.paramA1}`);
        Text.fontSize(30);
        Text.fontWeight(FontWeight.Bold);
        if (!isInitialRender) {
            Text.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    Text.pop();
    {
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            if (isInitialRender) {
                ViewPU.create(new HelloComponent(parent ? parent : this, { message: $$.paramA1 }, undefined, elmtId));
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {
                    message: $$.paramA1
                });
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
    }
    childBuilder.bind(this)(makeBuilderParameterProxy("childBuilder", { paramA1: () => $$.paramA1 }));
    Column.pop();
    Row.pop();
}
class HelloComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__message = new SynchedPropertySimpleOneWayPU(params.message, this, "message");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params: HelloComponent_Params) {
        if (params.message !== undefined) {
            this.__message.set(params.message);
        }
        else {
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
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(`HelloComponent===${this.message}`);
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function childBuilder($$: Tmp, parent = null) {
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Row.create();
        if (!isInitialRender) {
            Row.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Column.create();
        if (!isInitialRender) {
            Column.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Text.create(`childBuilder===${$$.paramA1}`);
        Text.fontSize(30);
        Text.fontWeight(FontWeight.Bold);
        if (!isInitialRender) {
            Text.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    Text.pop();
    {
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            if (isInitialRender) {
                ViewPU.create(new HelloChildComponent(parent ? parent : this, { message: $$.paramA1 }, undefined, elmtId));
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
    }
    grandsonBuilder.bind(this)(makeBuilderParameterProxy("grandsonBuilder", { paramA1: () => $$.paramA1 }));
    Column.pop();
    Row.pop();
}
class HelloChildComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__message = new ObservedPropertySimplePU('', this, "message");
        this.setInitiallyProvidedValue(params);
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
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(`HelloChildComponent===${this.message}`);
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function grandsonBuilder($$: Tmp, parent = null) {
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Row.create();
        if (!isInitialRender) {
            Row.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Column.create();
        if (!isInitialRender) {
            Column.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Text.create(`grandsonBuilder===${$$.paramA1}`);
        Text.fontSize(30);
        Text.fontWeight(FontWeight.Bold);
        if (!isInitialRender) {
            Text.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    Text.pop();
    {
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            if (isInitialRender) {
                ViewPU.create(new HelloGrandsonComponent(parent ? parent : this, { message: $$.__paramA1 }, undefined, elmtId));
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
    }
    Column.pop();
    Row.pop();
}
class HelloGrandsonComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__message = new SynchedPropertySimpleTwoWayPU(params.message, this, "message");
        this.setInitiallyProvidedValue(params);
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
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Row.create();
            if (!isInitialRender) {
                Row.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(`HelloGrandsonComponent===${this.message}`);
            Text.fontSize(30);
            Text.fontWeight(FontWeight.Bold);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class Parent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__label = new ObservedPropertySimplePU('Hello', this, "label");
        this.setInitiallyProvidedValue(params);
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
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        parentBuilder.bind(this)(makeBuilderParameterProxy("parentBuilder", { paramA1: () => (this["__label"] ? this["__label"] : this["label"]) }));
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Button.createWithLabel('Click me');
            Button.onClick(() => {
                this.label = 'ArkUI';
            });
            if (!isInitialRender) {
                Button.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
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
