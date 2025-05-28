[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / getAllFiles

# Function: getAllFiles()

> **getAllFiles**(`srcPath`, `exts`, `ignore`, `filenameArr`, `visited`): `string`[]

Defined in: src/utils/getAllFiles.ts:29

从指定目录中提取指定后缀名的所有文件

## Parameters

### srcPath

`string`

string 要提取文件的项目入口，相对或绝对路径都可

### exts

`string`[]

string[] 要提取的文件扩展名数组，每个扩展名需以点开头

### ignore

`string`[] = `[]`

### filenameArr

`string`[] = `[]`

string[] 用来存放提取出的文件的原始路径的数组，可不传，默认为空数组

### visited

`Set`\<`string`\> = `...`

## Returns

`string`[]

string[] 提取出的文件的原始路径数组
