# arkanalyzer ir（详细）

## 命令签名

```bash
arkanalyzer ir <input> [options]
```

- `<input>`：工程根目录
- 命令结束后，stdout 始终输出一行 JSON 摘要

## 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--output <dir>` | `-o` | 产物输出目录 | `out` |
| `--format <type>` | `-f` | 输出格式：`json`、`text`、`dot` | `text` |
| `--no-infer-types` | — | 跳过 `Scene.inferTypes()`（更快） | `inferTypes=true` |
| `--ohos-sdk-home <path>` | — | OHOS SDK 根路径（回退到 `OHOS_SDK_HOME`） | 未设置 |

## 格式行为

- `text`：输出可读 ArkIR（`.ir`）
- `json`：输出 JSON 文件（每个源码文件对应 `.json`）
- `dot`：输出 DOT 文件（每个源码文件对应 `.dot`）

## stdout 摘要格式

```json
{"input":"./myapp","format":"text","outputDir":"./out","fileCount":123}
```

## 示例

```bash
# 1) 导出可读 IR
arkanalyzer ir ./myapp -f text -o ./out

# 2) 导出 JSON 结构
arkanalyzer ir ./myapp -f json -o ./out

# 3) 导出 DOT
arkanalyzer ir ./myapp -f dot -o ./out
```
