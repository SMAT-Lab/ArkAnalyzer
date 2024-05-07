let __generate__Id: number = 0;
function generateId(): string {
    return "FoodDataModels_" + ++__generate__Id;
}
import { FoodData, Category } from './FoodData';
const FoodComposition: any[] = [
    { 'name': 'Tomato', 'image': $r('app.media.icon'), 'category': Category.Vegetable, 'calories': 17, 'protein': 0.9, 'fat': 0.2, 'carbohydrates': 3.9, 'vitaminC': 17.8 },
    { 'name': 'Walnut', 'image': $r('app.media.icon'), 'category': Category.Nut, 'calories': 654, 'protein': 15, 'fat': 65, 'carbohydrates': 14, 'vitaminC': 1.3 },
    { 'name': 'Cucumber', 'image': $r('app.media.icon'), 'category': Category.Vegetable, 'calories': 30, 'protein': 3, 'fat': 0, 'carbohydrates': 1.9, 'vitaminC': 2.1 },
    { 'name': 'Blueberry', 'image': $r('app.media.icon'), 'category': Category.Fruit, 'calories': 57, 'protein': 0.7, 'fat': 0.3, 'carbohydrates': 14, 'vitaminC': 9.7 },
    { 'name': 'Crab', 'image': $r('app.media.icon'), 'category': Category.Seafood, 'calories': 97, 'protein': 19, 'fat': 1.5, 'carbohydrates': 0, 'vitaminC': 7.6 },
    { 'name': 'IceCream', 'image': $r('app.media.icon'), 'category': Category.Dessert, 'calories': 207, 'protein': 3.5, 'fat': 11, 'carbohydrates': 24, 'vitaminC': 0.6 },
    { 'name': 'Onion', 'image': $r('app.media.icon'), 'category': Category.Vegetable, 'calories': 39, 'protein': 1.1, 'fat': 0.1, 'carbohydrates': 9, 'vitaminC': 7.4 },
    { 'name': 'Mushroom', 'image': $r('app.media.icon'), 'category': Category.Vegetable, 'calories': 22, 'protein': 3.1, 'fat': 0.3, 'carbohydrates': 3.3, 'vitaminC': 2.1 },
    { 'name': 'Kiwi', 'image': $r('app.media.icon'), 'category': Category.Fruit, 'calories': 60, 'protein': 1.1, 'fat': 0.5, 'carbohydrates': 15, 'vitaminC': 20.5 },
    { 'name': 'Pitaya', 'image': $r('app.media.icon'), 'category': Category.Fruit, 'calories': 60, 'protein': 1.2, 'fat': 0, 'carbohydrates': 10, 'vitaminC': 60.9 },
    { 'name': 'Avocado', 'image': $r('app.media.icon'), 'category': Category.Fruit, 'calories': 160, 'protein': 2, 'fat': 15, 'carbohydrates': 9, 'vitaminC': 10 },
    { 'name': 'Strawberry', 'image': $r('app.media.icon'), 'category': Category.Fruit, 'calories': 32, 'protein': 0.7, 'fat': 0.3, 'carbohydrates': 8, 'vitaminC': 58.8 }
];
export function initializeOnStartup(): Array<FoodData> {
    let FoodDataArray: Array<FoodData> = [];
    FoodComposition.forEach(item => {
        FoodDataArray.push(new FoodData(item.name, item.image, item.category, item.calories, item.protein, item.fat, item.carbohydrates, item.vitaminC));
    });
    return FoodDataArray;
}
