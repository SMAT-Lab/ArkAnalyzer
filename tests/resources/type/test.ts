function vulnerableFunction(): void {
      const buffer: string[] = new Array(5).fill(''); // 模拟长度为5的缓冲区
    
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
    
      readline.question('Enter a value: ', (input: string) => {
        // 不检查输入长度
        buffer.length = 0; // 清空缓冲区
        buffer.push(...input.split('')); // 将输入字符串分割为字符数组,并添加到缓冲区
    
        console.log(`You entered: ${buffer.join('')}`);
        readline.close();
      });
    }
    
    vulnerableFunction();