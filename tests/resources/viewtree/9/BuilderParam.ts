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
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.customBuilderParam = this.customBuilder;
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Column.create();
                if (!isInitialRender) {
                    Column.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            this.customBuilderParam.bind(this)();
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Text.create(`Parent builder `);
                if (!isInitialRender) {
                    Text.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            Text.pop();
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
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
namespace Case2 {
    class Child extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.label = `Child`;
            this.customBuilderParam = this.customBuilder;
            this.customChangeThisBuilderParam = this.customChangeThisBuilder;
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Column.create();
                if (!isInitialRender) {
                    Column.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            this.customBuilderParam.bind(this)();
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.label = `Parent`;
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
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private label: string;
        componentBuilder(parent = null) {
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Text.create(`${this.label}`);
                if (!isInitialRender) {
                    Text.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            Text.pop();
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
            this.componentBuilder.bind(this)();
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
        (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create($$.label);
            Text.width(400);
            Text.height(50);
            Text.backgroundColor(Color.Green);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
    }
    class Child extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.label = 'Child';
            this.customBuilderParam = this.customBuilder;
            this.customOverBuilderParam = overBuilder;
            this.setInitiallyProvidedValue(params);
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
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Column.create();
                if (!isInitialRender) {
                    Column.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            this.customBuilderParam.bind(this)();
            this.customOverBuilderParam.bind(this)(makeBuilderParameterProxy("customOverBuilderParam", { label: () => 'global Builder label' }));
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
    class Parent extends ViewPU {
        constructor(parent, params, __localStorage, elmtId = -1) {
            super(parent, __localStorage, elmtId);
            this.label = 'Parent';
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
        }
        aboutToBeDeleted() {
            SubscriberManager.Get().delete(this.id__());
            this.aboutToBeDeletedInternal();
        }
        private label: string;
        componentBuilder(parent = null) {
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                Text.create(`${this.label}`);
                if (!isInitialRender) {
                    Text.pop();
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
            Text.pop();
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
            this.componentBuilder.bind(this)();
            Column.pop();
        }
        rerender() {
            this.updateDirtyElements();
        }
    }
}
class CustomContainer extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__header = new SynchedPropertySimpleOneWayPU(params.header, this, "header");
        this.closer = this.closerBuilder;
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params: CustomContainer_Params) {
        if (params.header !== undefined) {
            this.__header.set(params.header);
        }
        else {
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
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create(this.header);
            Text.fontSize(30);
            if (!isInitialRender) {
                Text.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
        this.closer.bind(this)();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function specificParam(label1: string, label2: string, parent = null) {
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
        Text.create(label1);
        Text.fontSize(30);
        if (!isInitialRender) {
            Text.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    Text.pop();
    (parent ? parent : this).observeComponentCreation((elmtId, isInitialRender) => {
        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
        Text.create(label2);
        Text.fontSize(30);
        if (!isInitialRender) {
            Text.pop();
        }
        ViewStackProcessor.StopGetAccessRecording();
    });
    Text.pop();
    Column.pop();
}
class CustomContainerUser extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__text = new ObservedPropertySimplePU('header', this, "text");
        this.setInitiallyProvidedValue(params);
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
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        {
            this.observeComponentCreation((elmtId, isInitialRender) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    ViewPU.create(new 
                    // 创建CustomContainer，在创建CustomContainer时，通过其后紧跟一个大括号“{}”形成尾随闭包
                    // 作为传递给子组件CustomContainer @BuilderParam closer: () => void的参数
                    CustomContainer(this, {
                        header: this.text,
                        closer: () => {
                            this.observeComponentCreation((elmtId, isInitialRender) => {
                                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                                Column.create();
                                Column.backgroundColor(Color.Yellow);
                                Column.onClick(() => {
                                    this.text = 'changeHeader';
                                });
                                if (!isInitialRender) {
                                    Column.pop();
                                }
                                ViewStackProcessor.StopGetAccessRecording();
                            });
                            specificParam.bind(this)('testA', 'testB');
                            Column.pop();
                        }
                    }, undefined, elmtId));
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        header: this.text
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
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
