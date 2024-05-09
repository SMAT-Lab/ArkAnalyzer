/**
 * 36/37
 * 5/6
 * testcase_19_parameter.ts
 * 5(0)/5
 */
// 自定义一个简单的类作为参数类型
class Person {
    constructor(public name: string, public age: number) {
        console.log("person.con")
        console.log("}")
    }
}

// 定义一个自定义的测试类
class FunctionTester {
    // 测试函数：接受两个数字参数并返回它们的和
    addNumbers(num1: number, num2: number): number {
        console.log("this.addNumbers")
        console.log("}")
        return num1 + num2;
    }

    // 测试函数：接受一个字符串和一个数字，并返回拼接后的字符串
    concatenateStrings(str1: string, num: number): string {
        console.log("this.concatenateStrings")
        console.log("}")
        return str1 + num.toString();
    }

    // 测试函数：接受一个布尔值参数，并返回其相反值
    negateBoolean(value: boolean): boolean {
        console.log("this.negateBoolea")
        console.log("}")
        return !value;
    }

    // 测试函数：接受一个自定义类的实例作为参数，并返回拼接后的字符串
    greetPerson(person: Person): string {
        console.log("this.greetPerson")
        console.log("}")
        return `Hello, ${person.name}! You are ${person.age} years old.`;
    }
}

// 创建一个 FunctionTester 实例
const tester = new FunctionTester();

// 测试 addNumbers 函数
const result1 = tester.addNumbers(5, 10);

// 测试 concatenateStrings 函数
const result2 = tester.concatenateStrings("Number is ", 42);

// 测试 negateBoolean 函数
const result3 = tester.negateBoolean(true);

// 创建一个 Person 实例，并测试 greetPerson 函数
const person = new Person("Alice", 30);
const result4 = tester.greetPerson(person);
