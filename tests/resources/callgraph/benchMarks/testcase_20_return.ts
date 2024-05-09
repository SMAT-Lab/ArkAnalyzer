/**
 * 17/18
 * 2/3
 * testcase_20_return.ts
 * 1(0)/1
 */

// 定义一个自定义的测试类
class ReturnTester {
    // 测试函数：接受两个数字参数并返回它们的和
    addNumbers(num1: number, num2: number): number {
        return num1 + num2;
    }

    concatenateStrings(str1: string, num: number): string {
        return str1 + num.toString();
    }

    negateBoolean(value: boolean): boolean {
        return !value;
    }
}

// 创建一个 FunctionTester 实例
const tester = new ReturnTester();

// 测试 addNumbers 函数
const result = tester.addNumbers(5, 10);
