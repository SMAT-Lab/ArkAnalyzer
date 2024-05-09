import { Type, plainToclass } from 'class-transformer'

export class Car {
    data: string;
    test() : string {
        console.log('hello');
        return 'hello. this is my car';
    }
}

export class User {
    id: number;
    firstName: string;
    lastName: string;

    @Type(() => Car)
    car: Car;
}

export function deserialize(data: string) : User {
    let jsonObj = JSON.parse(data);
    let ans : User = plainToclass(User, jsonObj, { excludeExtraneousValues: true});
    return ans;
}

export function test(data:string): void {
    console.log(deserialize(data).car.test());
}