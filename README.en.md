# sig_programanalysis

English | [简体中文](./README.md)

## SIG Group Work Objectives and Scope

### Work Objectives

* Sig_programanalysis aims to carry out program analysis technology exploration, key technology identification, and competitiveness building for OpenHarmony systems and apps, striving to become the gathering place for OpenHarmony system and app analysis capabilities and an incubation place for related engineering tools.

* Sig_programanalysis will build a basic program analysis framework for OpenHarmony apps, and subsequently based on it to provide application developers with out-of-the-box defect scanning and analysis tools, making it possible to automatically vet code for scenarios such as IDE, CI/CD pipelines, etc.

### Work Scope

* Responsible for building and maintaining the key technology map of program analysis, as well as the decomposition of functional modules in the field, interface definition, and maintenance management.

* Responsible for the architecture design, open source development, and project maintenance of projects related to program analysis.


### Projects

Sig_programanalysis currently incubates the following projects. Everyone is welcome to participate (you can apply to participate in the co-construction of existing projects, or you can apply to create a new program analysis project).


* ArkAnalyzer:
The Static Analysis Framework for ArkTS-based OpenHarmony Apps.

* ArkCheck:
Checking OpenHarmony Apps for Potential Code-level Defects


## SIG Members


### Leader

- [lilicoding](https://gitee.com/lilicoding)


### Committers
- [kubigao](https://gitee.com/kubigao)
- [yifei-xue](https://gitee.com/yifei_xue)
- [kubrick-hjh](https://gitee.com/kubrick-hjh)
- [speed9](https://gitee.com/speeds)
- [bbsun](https://gitee.com/bbsun)
- [chn](https://gitee.com/chn)
- [Elouan](https://gitee.com/Elouan)
- [Rnine](https://gitee.com/Rnine)
- [workspace_cb](https://gitee.com/workspace_cb)
- [longyuC](https://gitee.com/longyuC)
- [xyji95](https://gitee.com/xyji95)
- [xulingyun-red](https://gitee.com/xulingyun-red)


### Meetings
 - Meeting Time: Bi-weekly meeting, Thursday 19:30 Beijing time
 - Meeting Application：[Link](https://shimo.im/forms/B1Awd60W7bU51g3m/fill)
 - Meeting Link: Welink or Others
 - Meeting Notification: [Subscribe to](https://lists.openatom.io/postorius/lists/dev.openharmony.io) mailing list dev@openharmony.io for the meeting link
 - Meeting Summary: [Archive link address](https://gitee.com/openharmony-sig/sig-content)

### Contact

- Mailing list: [dev@openharmony.io](https://lists.openatom.io/postorius/lists/dev@openharmony.io/)

*** 
# ArkAnalyzer: Static Program Analysis Framework for the ArkTS Language
## Develope environment setup
1. [Download Visual Studio Code](https://code.visualstudio.com/download) or other IDEA;
2. [Download Node.js](https://nodejs.org/en/download/current) and install it. Node.js is a runtime environment for JavaScript, which comes with its own package manager, npm. 
3. Install Typescript via npm: 
```shell
npm install -g typescript
```
4. Install dependency libraries
```shell
cd arkanalyzer
npm install
```
5. [Optional] Generate the latest API documentation, which will be created at docs/api_docs.
```shell
npm run gendoc
```

## Docmentations

1. ArkAnalyzer API docmentations，refer to the [link](docs/api_docs/globals.md).

## Commit codes
Follow the code repository standards of Openharmony-Sig, refer to the [link](docs/HowToCreatePR.md#english)

## Debug
Modify the `args` parameter array in the debug configuration file `.vscode/launch.json` to the path of the test file you want to debug, and then start the debugging process.

## Add test cases
Place all new test codes in the `tests` directory. Corresponding sample code and other resource files should be placed in the ``tests\resources` directory, and create different folders for each testing scenario.