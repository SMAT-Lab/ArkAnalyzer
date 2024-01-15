# ArkAnalyzer环境配置
1. 从[Download Visual Studio Code](https://code.visualstudio.com/download)下载vscode并安装。
2. 从[Download Node.js](https://nodejs.org/en/download/current)下载Node.js并安装，Node.js为JavaScript的运行时环境，自带包管理器npm。
3. 通过npm安装TypeScript编译器，命令行输入
```shell
npm install -g typescript
```
4. 通过npm在本地环境安装ts-node, ts-node使得在Node.js环境中可以直接运行TypeScript代码。命令行输入
```shell
npm install -D ts-node
```

# ArkAnalyzer调试
将调试配置文件`.vscode/launch.json`中`args`参数数组修改为想要调试的文件路径，然后启动调试。

# 添加测试用例
新增测试代码统一放至`tests`目录下，对应的样例代码和其他资源文件统一放至`tests\resources`,按测试场景创建不同文件夹。
