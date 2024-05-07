/**
 * 27/28
 * 5/6
 * testcase_21_return.ts
 */

// 自定义一个简单的类作为返回对象类型
class Person {
    constructor(public name: string, public age: number) {}
}

// 定义一个辅助函数，用于验证年龄是否大于 18
function isAdult(age: number): boolean {
    return age >= 18;
}

// 定义一个辅助函数，用于根据年龄生成问候语
function generateGreeting(name: string, age: number): string {
    if (isAdult(age)) {
        return `Hello, ${name}! Welcome to the adult world!`;
    } else {
        return `Hello, ${name}! You are still young!`;
    }
}

// 定义一个自定义的测试类
class ReturnTester_a {
    // 测试函数：接受一个自定义类的实例作为参数，并返回该实例以及根据年龄生成的问候语
    createPersonWithGreeting(name: string, age: number): { person: Person, greeting: string } {
        const person = new Person(name, age);
        const greeting = generateGreeting(name, age);
        return { person, greeting };
    }
}

// 创建一个 FunctionTester 实例
let tester_a = new ReturnTester_a();

// 测试 createPersonWithGreeting 函数
const { person, greeting } = tester_a.createPersonWithGreeting("Alice", 30);
