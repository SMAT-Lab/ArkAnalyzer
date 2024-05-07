interface FoodDetail_Params {
    foodItem?: FoodData;
}
interface ContentTable_Params {
    foodItem?: FoodData;
}
interface FoodImageDisplay_Params {
    foodItem?: FoodData;
}
interface PageTitle_Params {
}
let __generate__Id: number = 0;
function generateId(): string {
    return "FoodDetail_" + ++__generate__Id;
}
import router from '@ohos.router';
import { FoodData } from '../model/FoodData';
class PageTitle extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: PageTitle_Params) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    render() {
        Flex.create({ alignItems: ItemAlign.Start });
        Flex.height(61);
        Flex.backgroundColor('#FFedf2f5');
        Flex.padding({ top: 13, bottom: 15, left: 28.3 });
        Flex.onClick(() => {
            router.back();
        });
        Image.create($r('app.media.icon'));
        Image.width(21.8);
        Image.height(19.6);
        Text.create('Food Detail');
        Text.fontSize(21.8);
        Text.margin({ left: 17.4 });
        Text.pop();
        Flex.pop();
    }
}
class FoodImageDisplay extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItem = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodImageDisplay_Params) {
        if (params.foodItem !== undefined) {
            this.foodItem = params.foodItem;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItem: FoodData;
    render() {
        Stack.create({ alignContent: Alignment.BottomStart });
        Stack.backgroundColor('#FFedf2f5');
        Stack.height(357);
        Image.create(this.foodItem.image);
        Image.objectFit(ImageFit.Contain);
        Text.create(this.foodItem.name);
        Text.fontSize(26);
        Text.fontWeight(500);
        Text.margin({ left: 26, bottom: 17.4 });
        Text.pop();
        Stack.pop();
    }
}
class ContentTable extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItem = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: ContentTable_Params) {
        if (params.foodItem !== undefined) {
            this.foodItem = params.foodItem;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItem: FoodData;
    IngredientItem(title: string, name: string, value: string, parent = null) {
        Flex.create();
        Text.create(title);
        Text.fontSize(17.4);
        Text.fontWeight(FontWeight.Bold);
        Text.layoutWeight(1);
        Text.pop();
        Flex.create({ alignItems: ItemAlign.Center });
        Flex.layoutWeight(2);
        Text.create(name);
        Text.fontSize(17.4);
        Text.flexGrow(1);
        Text.pop();
        Text.create(value);
        Text.fontSize(17.4);
        Text.pop();
        Flex.pop();
        Flex.pop();
    }
    render() {
        Flex.create({ direction: FlexDirection.Column, justifyContent: FlexAlign.SpaceBetween, alignItems: ItemAlign.Start });
        Flex.padding({ top: 20, right: 20, left: 20 });
        Flex.height(250);
        this.IngredientItem('Calories', 'Calories', this.foodItem.calories + 'kcal', this);
        this.IngredientItem('Nutrition', 'Protein', this.foodItem.protein + 'g', this);
        this.IngredientItem(' ', 'Fat', this.foodItem.fat + 'g', this);
        this.IngredientItem(' ', 'Carbohydrates', this.foodItem.carbohydrates + 'g', this);
        this.IngredientItem(' ', 'VitaminC', this.foodItem.vitaminC + 'mg', this);
        Flex.pop();
    }
}
class FoodDetail extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.foodItem = undefined;
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params: FoodDetail_Params) {
        if (params.foodItem !== undefined) {
            this.foodItem = params.foodItem;
        }
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    private foodItem: FoodData;
    aboutToAppear() {
        this.foodItem = <FoodData>router.getParams()["foodId"];
    }
    render() {
        Column.create();
        Column.alignItems(HorizontalAlign.Center);
        Stack.create({ alignContent: Alignment.TopStart });
        let earlierCreatedChild_18: FoodImageDisplay = (this && this.findChildById) ? this.findChildById("18") as FoodImageDisplay : undefined;
        if (earlierCreatedChild_18 == undefined) {
            View.create(new FoodImageDisplay("18", this, { foodItem: this.foodItem }));
        }
        else {
            earlierCreatedChild_18.updateWithValueParams({
                foodItem: this.foodItem
            });
            if (!earlierCreatedChild_18.needsUpdate()) {
                earlierCreatedChild_18.markStatic();
            }
            View.create(earlierCreatedChild_18);
        }
        let earlierCreatedChild_19: PageTitle = (this && this.findChildById) ? this.findChildById("19") as PageTitle : undefined;
        if (earlierCreatedChild_19 == undefined) {
            View.create(new PageTitle("19", this, {}));
        }
        else {
            earlierCreatedChild_19.updateWithValueParams({});
            if (!earlierCreatedChild_19.needsUpdate()) {
                earlierCreatedChild_19.markStatic();
            }
            View.create(earlierCreatedChild_19);
        }
        Stack.pop();
        let earlierCreatedChild_20: ContentTable = (this && this.findChildById) ? this.findChildById("20") as ContentTable : undefined;
        if (earlierCreatedChild_20 == undefined) {
            View.create(new ContentTable("20", this, { foodItem: this.foodItem }));
        }
        else {
            earlierCreatedChild_20.updateWithValueParams({
                foodItem: this.foodItem
            });
            if (!earlierCreatedChild_20.needsUpdate()) {
                earlierCreatedChild_20.markStatic();
            }
            View.create(earlierCreatedChild_20);
        }
        Column.pop();
    }
}
loadDocument(new FoodDetail("17", undefined, {}));
