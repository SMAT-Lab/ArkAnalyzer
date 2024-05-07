// 定义一个简单的类
export class DataProcessor {
    processData(str: string, num: number): { data: { message: string, value: number } } {
        console.log("DataProcessor.pricessData(){")
        console.log("}")
        return {
            data: {
                message: `Input string: ${str}`,
                value: num * 2
            }
        };
    }
}
