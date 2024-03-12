import * as sourceMap from 'source-map';

// const sourceMap = require('source-map')
const tsmap = require('fs').readFileSync('D:/11study/openharmony/ArkUIWeChat/resultTsDir/entry/src/main/ets/model/CommonStyle.ts.map', 'utf-8')

async function func() {
    let consumer =await new sourceMap.SourceMapConsumer(tsmap)
    const compressedPosition = {
        line: 1,
        column: 0
    };

    const originalPosition = consumer.originalPositionFor(compressedPosition);
    logger.info(originalPosition); 
}

func()


// const fs = require('fs');
// import { SourceMapConsumer } from 'source-map';

// // 假设你有一个函数来处理 sourceMap，这里只是一个简单的示例
// function processSourceMap(sourceMap: string) {
//     // 在这个函数中处理 sourceMap
//     SourceMapConsumer.with(sourceMap, null, (consumer: any) => { // 显式声明 consumer 的类型为 any 或者适当的类型
//         // 在这里使用 consumer
//             const transformedPosition = { line: 1, column: 10 };

//     // 获取转换后代码的原始位置
//     const originalPosition = consumer.originalPositionFor(transformedPosition);

//     // 输出原始位置信息
//     logger.info(`Original Position: ${originalPosition.line}:${originalPosition.column}`);
//     });
// }

// // 调用函数并传入 sourceMap
// const sourceMap = fs.readFileSync('D:/11study/openharmony/ArkUIWeChat/resultTsDir/entry/src/main/ets/model/CommonStyle.ts.map', 'utf-8');
// processSourceMap(sourceMap);

