# ArkAnalyzer环境配置
VSCode的TypeScript环境配置参考https://code.visualstudio.com/docs/languages/typescript。ArkAnalyzer的调试依赖ts-node,可下载https://drive.google.com/file/d/17sA8SzWhiULH7-_gSJTIayBRQ9-tT5tW/view?usp=drive_link 打包好的ts-node执行环境，解压后拷贝至本地代码仓。

# ArkAnalyzer调试
`.vscode/launch.json`中预设了调试配置，调试前可将`args`参数数组修改为想要调试的文件路径

# 测试代码导入
新增测试代码统一放至`tests`目录下，对应的样例代码和其他资源文件统一放至`tests\resources`,按测试场景创建不同文件夹。
