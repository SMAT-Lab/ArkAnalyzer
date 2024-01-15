let complexArrowFunction = (param1: number, param2: string): string => {
    // 复杂的逻辑，可能包含多个语句
    let result = "Initial Value";

    if (param1 > 0) {
        result = "Positive";
    } else if (param1 < 0) {
        result = "Negative";
    } else {
        result = "Zero";
    }

    for (let i = 0; i < param1; i++) {
        // 一些循环逻辑
        result += param2;
    }

    // 更多逻辑...

    // 返回结果
    return result;
};
let subtract = (x: number, y: number): number => x - y;
let add = function(x: number, y: number): number {
    return x + y;
};