interface CountDownComponent_Params {
    count?: number;
    costOfOneAttempt?: number;
}
interface ParentComponent_Params {
    countDownStartValue?: number;
}
let __generate__Id: number = 0;
function generateId(): string {
    return "propSimpleModel_" + ++__generate__Id;
}
class ParentComponent extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__countDownStartValue = new ObservedPropertySimple(10, this, "countDownStartValue");
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: ParentComponent_Params) {
        if (params.countDownStartValue !== undefined) {
            this.countDownStartValue = params.countDownStartValue;
        }
    }
    aboutToBeDeleted() {
        this.__countDownStartValue.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private __countDownStartValue: ObservedPropertySimple<number>; // 10 Nuggets default start value in a Game
    get countDownStartValue() {
        return this.__countDownStartValue.get();
    }
    set countDownStartValue(newValue: number) {
        this.__countDownStartValue.set(newValue);
    }
    render() {
        Column.create();
        Text.create(`Grant ${this.countDownStartValue} nuggets to play.`);
        Text.pop();
        Button.createWithChild();
        Button.onClick(() => {
            this.countDownStartValue += 1;
        });
        Text.create("+1 - Nuggets in New Game");
        Text.pop();
        Button.pop();
        Button.createWithChild();
        Button.onClick(() => {
            this.countDownStartValue -= 1;
        });
        Text.create("-1  - Nuggets in New Game");
        Text.pop();
        Button.pop();
        let earlierCreatedChild_2: CountDownComponent = (this && this.findChildById) ? this.findChildById("2") as CountDownComponent : undefined;
        if (earlierCreatedChild_2 == undefined) {
            // when creatng ChildComponent, the initial value of its @Prop variable must be supplied in a named constructor parameter
            // also regular costOfOneAttempt (non-Prop) variable is initialied
            View.create(new CountDownComponent("2", this, { count: this.countDownStartValue, costOfOneAttempt: 2 }));
        }
        else {
            earlierCreatedChild_2.updateWithValueParams({
                count: this.countDownStartValue, costOfOneAttempt: 2
            });
            View.create(earlierCreatedChild_2);
        }
        Column.pop();
    }
}
class CountDownComponent extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__count = new SynchedPropertySimpleOneWay(params.count, this, "count");
        this.costOfOneAttempt = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: CountDownComponent_Params) {
        this.count = params.count;
        if (params.costOfOneAttempt !== undefined) {
            this.costOfOneAttempt = params.costOfOneAttempt;
        }
    }
    aboutToBeDeleted() {
        this.__count.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private __count: SynchedPropertySimpleOneWay<number>;
    get count() {
        return this.__count.get();
    }
    set count(newValue: number) {
        this.__count.set(newValue);
    }
    private costOfOneAttempt?: number;
    render() {
        Column.create();
        If.create();
        if (this.count > 0) {
            If.branchId(0);
            Text.create(`You have ${this.count} Nuggets left`);
            Text.pop();
        }
        else {
            If.branchId(1);
            Text.create("Game over!");
            Text.pop();
            Image.create('');
            View.create(new CountDownComponent("2", this, { count: 0, costOfOneAttempt: 2 }));
        }
        If.pop();
        Button.createWithChild();
        Button.onClick(() => {
            this.count -= this.costOfOneAttempt;
        });
        Text.create("Try again");
        Text.pop();
        Image.create('');
        Button.pop();
        Image.create('');
        Column.pop();
    }
}
loadDocument(new ParentComponent("1", undefined, {}));


class Test extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.data = new MyDataSource();
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: Test_Params) {
        if (params.data !== undefined) {
            this.data = params.data;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private data: MyDataSource;
    render() {
        Grid.create();
        LazyForEach.create("4", this, ObservedObject.GetRawObject(this.data), (row) => {
            this.isRenderingInProgress = true;
            GridItem.create();
            Text.create(row);
            Text.pop();
            GridItem.pop();
            this.isRenderingInProgress = false;
        }, row => row);
        LazyForEach.pop();
        Grid.pop();
    }
}
loadDocument(new Test("1", undefined, {}));
