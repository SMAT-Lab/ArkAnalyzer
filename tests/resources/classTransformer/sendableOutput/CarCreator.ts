import { BusCreatorVar } from "./BusCreator.ts"

export class CarCreator {
    create(): Car {
        let ans: Car = new Car();
        
		ans.b = BusCreatorVar.create()

        return ans;
    }
}

let CarCreatorVar = new CarCreator()
export { CarCreatorVar };