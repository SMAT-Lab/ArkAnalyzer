interface FoodCategoryList_Params {
    foodItems?: FoodData[];
    showList?: boolean;
}
interface FoodCategory_Params {
    foodItems?: FoodData[];
}
interface FoodGrid_Params {
    foodItems?: FoodData[];
    gridRowTemplate?: string;
    heightValue?: number;
}
interface FoodGridItem_Params {
    foodItem?: FoodData;
}
interface FoodList_Params {
    foodItems?: FoodData[];
}
interface FoodListItem_Params {
    foodItem?: FoodData;
}
let __generate__Id: number = 0;
function generateId(): string {
    return "FoodCategoryList_" + ++__generate__Id;
}
import router from '@ohos.router';
import { Category, FoodData } from '../model/FoodData';
import { initializeOnStartup } from '../model/FoodDataModels';
class FoodListItem extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItem = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodListItem_Params) {
        if (params.foodItem !== undefined) {
            this.foodItem = params.foodItem;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItem: FoodData;
    render() {
        Navigator.create({ target: 'pages/FoodDetail' });
        Navigator.params({ foodId: this.foodItem });
        Navigator.margin({ right: 24, left: 32 });
        Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
        Flex.height(64);
        Row.create();
        Row.backgroundColor('#FFf1f3f5');
        Row.margin({ right: 16 });
        Image.create(this.foodItem.image);
        Image.objectFit(ImageFit.Contain);
        Image.autoResize(false);
        Image.height(40);
        Image.width(40);
        Row.pop();
        Text.create(this.foodItem.name);
        Text.fontSize(14);
        Text.flexGrow(1);
        Text.pop();
        Text.create(this.foodItem.calories + ' kcal');
        Text.fontSize(14);
        Text.pop();
        Flex.pop();
        Navigator.pop();
    }
}
class FoodList extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItems = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodList_Params) {
        if (params.foodItems !== undefined) {
            this.foodItems = params.foodItems;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItems: FoodData[];
    render() {
        Column.create();
        Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
        Flex.height('7%');
        Flex.backgroundColor('#FFf1f3f5');
        Text.create('Food List');
        Text.fontSize(20);
        Text.margin({ left: 20 });
        Text.pop();
        Flex.pop();
        List.create();
        List.height('93%');
        ForEach.create("6", this, ObservedObject.GetRawObject(this.foodItems), item => {
            ListItem.create();
            let earlierCreatedChild_5: FoodListItem = (this && this.findChildById) ? this.findChildById("5") as FoodListItem : undefined;
            if (earlierCreatedChild_5 == undefined) {
                View.create(new FoodListItem("5", this, { foodItem: item }));
            }
            else {
                earlierCreatedChild_5.updateWithValueParams({
                    foodItem: item
                });
                if (!earlierCreatedChild_5.needsUpdate()) {
                    earlierCreatedChild_5.markStatic();
                }
                View.create(earlierCreatedChild_5);
            }
            ListItem.pop();
        }, item => item.id.toString());
        ForEach.pop();
        List.pop();
        Column.pop();
    }
}
class FoodGridItem extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItem = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodGridItem_Params) {
        if (params.foodItem !== undefined) {
            this.foodItem = params.foodItem;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItem: FoodData;
    render() {
        Column.create();
        Column.height(184);
        Column.width('100%');
        Column.onClick(() => {
            router.push({ url: 'pages/FoodDetail', params: { foodId: this.foodItem } });
        });
        Row.create();
        Row.backgroundColor('#FFf1f3f5');
        Image.create(this.foodItem.image);
        Image.objectFit(ImageFit.Contain);
        Image.height(152);
        Image.width('100%');
        Row.pop();
        Flex.create({ justifyContent: FlexAlign.Start, alignItems: ItemAlign.Center });
        Flex.height(32);
        Flex.width('100%');
        Flex.backgroundColor('#FFe5e5e5');
        Text.create(this.foodItem.name);
        Text.fontSize(14);
        Text.flexGrow(1);
        Text.padding({ left: 8 });
        Text.pop();
        Text.create(this.foodItem.calories + 'kcal');
        Text.fontSize(14);
        Text.margin({ right: 6 });
        Text.pop();
        Flex.pop();
        Column.pop();
    }
}
class FoodGrid extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItems = undefined;
        this.gridRowTemplate = '';
        this.heightValue = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodGrid_Params) {
        if (params.foodItems !== undefined) {
            this.foodItems = params.foodItems;
        }
        if (params.gridRowTemplate !== undefined) {
            this.gridRowTemplate = params.gridRowTemplate;
        }
        if (params.heightValue !== undefined) {
            this.heightValue = params.heightValue;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItems: FoodData[];
    private gridRowTemplate: string;
    private heightValue: number;
    aboutToAppear() {
        var rows = Math.round(this.foodItems.length / 2);
        this.gridRowTemplate = '1fr '.repeat(rows);
        this.heightValue = rows * 192 - 8;
    }
    render() {
        Scroll.create();
        Scroll.scrollBar(BarState.Off);
        Scroll.padding({ left: 16, right: 16 });
        Grid.create();
        Grid.rowsTemplate(this.gridRowTemplate);
        Grid.columnsTemplate('1fr 1fr');
        Grid.columnsGap(8);
        Grid.rowsGap(8);
        Grid.height(this.heightValue);
        ForEach.create("8", this, ObservedObject.GetRawObject(this.foodItems), (item: FoodData) => {
            GridItem.create();
            let earlierCreatedChild_7: FoodGridItem = (this && this.findChildById) ? this.findChildById("7") as FoodGridItem : undefined;
            if (earlierCreatedChild_7 == undefined) {
                View.create(new FoodGridItem("7", this, { foodItem: item }));
            }
            else {
                earlierCreatedChild_7.updateWithValueParams({
                    foodItem: item
                });
                if (!earlierCreatedChild_7.needsUpdate()) {
                    earlierCreatedChild_7.markStatic();
                }
                View.create(earlierCreatedChild_7);
            }
            GridItem.pop();
        }, (item: FoodData) => item.id.toString());
        ForEach.pop();
        Grid.pop();
        Scroll.pop();
    }
}
class FoodCategory extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItems = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodCategory_Params) {
        if (params.foodItems !== undefined) {
            this.foodItems = params.foodItems;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItems: FoodData[];
    render() {
        Stack.create();
        Tabs.create();
        Tabs.barWidth('80%');
        Tabs.barHeight(70);
        Tabs.barMode(BarMode.Scrollable);
        TabContent.create();
        TabContent.tabBar('All');
        let earlierCreatedChild_9: FoodGrid = (this && this.findChildById) ? this.findChildById("9") as FoodGrid : undefined;
        if (earlierCreatedChild_9 == undefined) {
            View.create(new FoodGrid("9", this, { foodItems: this.foodItems }));
        }
        else {
            earlierCreatedChild_9.updateWithValueParams({
                foodItems: this.foodItems
            });
            if (!earlierCreatedChild_9.needsUpdate()) {
                earlierCreatedChild_9.markStatic();
            }
            View.create(earlierCreatedChild_9);
        }
        TabContent.pop();
        TabContent.create();
        TabContent.tabBar('Vegetable');
        let earlierCreatedChild_10: FoodGrid = (this && this.findChildById) ? this.findChildById("10") as FoodGrid : undefined;
        if (earlierCreatedChild_10 == undefined) {
            View.create(new FoodGrid("10", this, { foodItems: this.foodItems.filter(item => (item.category === Category.Vegetable)) }));
        }
        else {
            earlierCreatedChild_10.updateWithValueParams({
                foodItems: this.foodItems.filter(item => (item.category === Category.Vegetable))
            });
            if (!earlierCreatedChild_10.needsUpdate()) {
                earlierCreatedChild_10.markStatic();
            }
            View.create(earlierCreatedChild_10);
        }
        TabContent.pop();
        TabContent.create();
        TabContent.tabBar('Fruit');
        let earlierCreatedChild_11: FoodGrid = (this && this.findChildById) ? this.findChildById("11") as FoodGrid : undefined;
        if (earlierCreatedChild_11 == undefined) {
            View.create(new FoodGrid("11", this, { foodItems: this.foodItems.filter(item => (item.category === Category.Fruit)) }));
        }
        else {
            earlierCreatedChild_11.updateWithValueParams({
                foodItems: this.foodItems.filter(item => (item.category === Category.Fruit))
            });
            if (!earlierCreatedChild_11.needsUpdate()) {
                earlierCreatedChild_11.markStatic();
            }
            View.create(earlierCreatedChild_11);
        }
        TabContent.pop();
        TabContent.create();
        TabContent.tabBar('Nut');
        let earlierCreatedChild_12: FoodGrid = (this && this.findChildById) ? this.findChildById("12") as FoodGrid : undefined;
        if (earlierCreatedChild_12 == undefined) {
            View.create(new FoodGrid("12", this, { foodItems: this.foodItems.filter(item => (item.category === Category.Nut)) }));
        }
        else {
            earlierCreatedChild_12.updateWithValueParams({
                foodItems: this.foodItems.filter(item => (item.category === Category.Nut))
            });
            if (!earlierCreatedChild_12.needsUpdate()) {
                earlierCreatedChild_12.markStatic();
            }
            View.create(earlierCreatedChild_12);
        }
        TabContent.pop();
        TabContent.create();
        TabContent.tabBar('Seafood');
        let earlierCreatedChild_13: FoodGrid = (this && this.findChildById) ? this.findChildById("13") as FoodGrid : undefined;
        if (earlierCreatedChild_13 == undefined) {
            View.create(new FoodGrid("13", this, { foodItems: this.foodItems.filter(item => (item.category === Category.Seafood)) }));
        }
        else {
            earlierCreatedChild_13.updateWithValueParams({
                foodItems: this.foodItems.filter(item => (item.category === Category.Seafood))
            });
            if (!earlierCreatedChild_13.needsUpdate()) {
                earlierCreatedChild_13.markStatic();
            }
            View.create(earlierCreatedChild_13);
        }
        TabContent.pop();
        TabContent.create();
        TabContent.tabBar('Dessert');
        let earlierCreatedChild_14: FoodGrid = (this && this.findChildById) ? this.findChildById("14") as FoodGrid : undefined;
        if (earlierCreatedChild_14 == undefined) {
            View.create(new FoodGrid("14", this, { foodItems: this.foodItems.filter(item => (item.category === Category.Dessert)) }));
        }
        else {
            earlierCreatedChild_14.updateWithValueParams({
                foodItems: this.foodItems.filter(item => (item.category === Category.Dessert))
            });
            if (!earlierCreatedChild_14.needsUpdate()) {
                earlierCreatedChild_14.markStatic();
            }
            View.create(earlierCreatedChild_14);
        }
        TabContent.pop();
        Tabs.pop();
        Stack.pop();
    }
}
class FoodCategoryList extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItems = initializeOnStartup();
        this.__showList = new ObservedPropertySimple(false, this, "showList");
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodCategoryList_Params) {
        if (params.foodItems !== undefined) {
            this.foodItems = params.foodItems;
        }
        if (params.showList !== undefined) {
            this.showList = params.showList;
        }
    }
    aboutToBeDeleted() {
        this.__showList.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    private foodItems: FoodData[];
    private __showList: ObservedPropertySimple<boolean>;
    get showList() {
        return this.__showList.get();
    }
    set showList(newValue: boolean) {
        this.__showList.set(newValue);
    }
    render() {
        Column.create();
        Column.height('100%');
        Stack.create({ alignContent: Alignment.TopEnd });
        If.create();
        if (this.showList) {
            If.branchId(0);
            let earlierCreatedChild_15: FoodList = (this && this.findChildById) ? this.findChildById("15") as FoodList : undefined;
            if (earlierCreatedChild_15 == undefined) {
                View.create(new FoodList("15", this, { foodItems: this.foodItems }));
            }
            else {
                earlierCreatedChild_15.updateWithValueParams({
                    foodItems: this.foodItems
                });
                if (!earlierCreatedChild_15.needsUpdate()) {
                    earlierCreatedChild_15.markStatic();
                }
                View.create(earlierCreatedChild_15);
            }
        }
        else {
            If.branchId(1);
            let earlierCreatedChild_16: FoodCategory = (this && this.findChildById) ? this.findChildById("16") as FoodCategory : undefined;
            if (earlierCreatedChild_16 == undefined) {
                View.create(new FoodCategory("16", this, { foodItems: this.foodItems }));
            }
            else {
                earlierCreatedChild_16.updateWithValueParams({
                    foodItems: this.foodItems
                });
                if (!earlierCreatedChild_16.needsUpdate()) {
                    earlierCreatedChild_16.markStatic();
                }
                View.create(earlierCreatedChild_16);
            }
        }
        If.pop();
        Image.create($r('app.media.icon'));
        Image.height(24);
        Image.width(24);
        Image.margin({ top: 15, right: 10 });
        Image.onClick(() => {
            this.showList = !this.showList;
        });
        Stack.pop();
        Column.pop();
    }
}
loadDocument(new FoodCategoryList("4", undefined, {}));
