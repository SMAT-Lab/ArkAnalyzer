# ArkAnalyzer 环境配置
1. 从[Download Visual Studio Code](https://code.visualstudio.com/download)下载vscode并安装，或安装其他IDE。
2. 从[Download Node.js](https://nodejs.org/en/download/current)下载Node.js并安装，Node.js为JavaScript的运行时环境，自带包管理器npm。
3. 通过npm安装TypeScript编译器，命令行输入
```shell
npm install -g typescript
```
4. 安装依赖库
```shell
npm install
```

# ArkAnalyzer 代码上库
注意：代码验证无误后先合入dev分支，待dev分支稳定后再cherry-pick到main分支
1. 本地代码提交
```shell
git add .
git commit -m "message"
```
2. 拉取分支最新代码，与本地代码合并, 注意加上`--rebase`参数以免生成不必要的merge节点
```shell
git pull --rebase
```
3. 本地充分测试合并后的代码
4. 将代码提交至远端仓库对应分支
```shell
git push
```

# ArkAnalyzer 调试
将调试配置文件`.vscode/launch.json`中`args`参数数组修改为想要调试的文件路径，然后启动调试。

# 添加自验证测试用例
新增测试代码统一放至`tests`目录下，对应的样例代码和其他资源文件统一放至`tests\resources`,按测试场景创建不同文件夹。
