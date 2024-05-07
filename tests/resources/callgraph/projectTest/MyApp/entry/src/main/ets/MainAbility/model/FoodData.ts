let __generate__Id: number = 0;
function generateId(): string {
    return "FoodData_" + ++__generate__Id;
}
export enum Category {
    Fruit,
    Vegetable,
    Nut,
    Seafood,
    Dessert
}
let NextId = 0;
export class FoodData {
    id: string;
    name: string;
    image: Resource;
    category: Category;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    vitaminC: number;
    constructor(name: string, image: Resource, category: Category, calories: number, protein: number, fat: number, carbohydrates: number, vitaminC: number) {
        this.id = `${NextId++}`;
        this.name = name;
        this.image = image;
        this.category = category;
        this.calories = calories;
        this.protein = protein;
        this.fat = fat;
        this.carbohydrates = carbohydrates;
        this.vitaminC = vitaminC;
    }
}
