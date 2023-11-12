const data: number[] = [1, 2, 3, 4, 5];

for (let i = 0; i < data.length; i++) {
    // 使用 if 判断
    if (data[i] % 2 === 0) {
        console.log(`${data[i]} 是偶数`);
    } else {
        console.log(`${data[i]} 是奇数`);
    }

    // 使用 switch 判断
    switch (data[i] % 3) {
        case 0:
            console.log(`${data[i]} 可被 3 整除`);
            break;
        case 1:
            console.log(`${data[i]} 除以 3 余 1`);
            break;
        case 2:
            console.log(`${data[i]} 除以 3 余 2`);
            break;
        default:
            console.log("无法判断");
    }

    // 使用 while 循环
    let count = 0;
    while (count < data[i]) {
        console.log(`当前计数: ${count}`);
        count++;
    }

    // 使用 for 循环和 continue
    for (let j = 0; j < 5; j++) {
        if (j === 2) {
            continue; // 跳过本次循环的剩余代码，进入下一次循环
        }
        console.log(`当前内层循环计数: ${j}`);
    }

    // 使用 break 终止循环
    for (let k = 0; k < 3; k++) {
        console.log(`外层循环计数: ${k}`);
        if (k === 1) {
            break; // 终止整个循环
        }
    }
}
