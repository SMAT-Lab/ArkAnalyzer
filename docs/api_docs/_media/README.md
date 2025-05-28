# sig_programanalysis

简体中文 | [English](./README.en.md)

说明：本SIG的内容遵循OpenHarmony的PMC管理章程 [README](../../zh/pmc.md)中描述的约定。


## SIG组工作目标和范围

  

### 工作目标

* 程序分析-SIG（Sig_programanalysis） 旨在面向OpenHarmony系统和原生应用开展程序分析技术洞察、关键技术识别和竞争力构建，同时成为OpenHarmony系统和应用程序分析能力的聚集地和相关工程工具的孵化地。

* 程序分析-SIG（Sig_programanalysis）将面向OpenHarmony应用构建基础程序分析框架并基于此为应用开发者提供开箱即用的缺陷扫描分析工具，面向IDE、流水线门禁、应用市场上架审核等场景，打造自动化工具看护能力。

### 工作范围

* 负责程序分析子领域关键根技术地图梳理，以及领域内功能模块分解、接口定义与维护管理等工作。

* 负责程序分析子领域相关项目的架构设计、开源开发和项目维护等工作。


### 项目孵化

程序分析-SIG（Sig_programanalysis）正积极孵化如下项目，欢迎大家参与共享共建（可申请参与已有项目的共建，也可申请创建新的程序分析项目并联合社区启动开源共建）。


* 方舟分析器（ArkAnalyzer）:
	面向ArkTS的OpenHarmony应用程序分析框架。

* 方舟检测器（ArkCheck）:
	面向OpenHarmony应用开发提供代码级缺陷自动检测（I期聚焦高性能编码规则的自动化检测）



## SIG组成员


### Leader

- [lilicoding](https://gitcode.com/lilicoding)


### Committers列表
- [kubigao](https://gitcode.com/kubigao)
- [yifei-xue](https://gitcode.com/yifei-xue)
- [kubrick-hjh](https://gitcode.com/kubrick-hjh)
- [speed9](https://gitee.com/speeds)
- [bbsun](https://gitcode.com/bbsun)
- [chn](https://gitcode.com/chn)
- [Elouan](https://gitcode.com/Elouan)
- [Rnine](https://gitcode.com/Rnine1)
- [workspace_cb](https://gitee.com/workspace_cb)
- [longyuC](https://gitee.com/longyuC)
- [xyji95](https://gitcode.com/xyji95)
- [xulingyun](https://gitcode.com/muya318)


### 会议
 - 会议时间：双周例会，周四晚上19:00, UTC+8
 - 会议申报：[申报链接](https://shimo.im/forms/B1Awd60W7bU51g3m/fill)
 - 会议链接：Welink或其他会议
 - 会议通知：请[订阅](https://lists.openatom.io/postorius/lists/dev.openharmony.io)邮件列表 dev@openharmony.io 获取会议链接
 - 会议纪要：[归档链接地址](https://gitee.com/openharmony-sig/sig-content)


### Contact (optional)

- 邮件列表：[dev@openharmony.io](https://lists.openatom.io/postorius/lists/dev@openharmony.io/)

***

# 方舟分析器：面向ArkTS语言的静态程序分析框架
## ArkAnalyzer 环境配置
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
5. 【可选】生成最新API文档，文档生成在 docs/api_docs。
```shell
npm run gendoc
```

## ArkAnalyzer 文档

1. ArkAnalyzer 快速入门文档，请参考：[链接](docs/QuickStart.md)。
2. ArkAnalyzer API文档，请参考：[链接](docs/api_docs/globals.md)。

## ArkAnalyzer 代码上库
遵守openharmony-sig代码上库规范, 操作方法请参考：[链接](docs/HowToCreatePR.md#中文)

## ArkAnalyzer 调试
将调试配置文件`.vscode/launch.json`中`args`参数数组修改为想要调试的文件路径，然后启动调试。

## 添加自验证测试用例
新增测试代码统一放至`tests`目录下，对应的样例代码和其他资源文件统一放至`tests\resources`,按测试场景创建不同文件夹。

## ArkAnalyzer Issues
请参考[连接](docs/HowToHandleIssues.md)提交Issues。
