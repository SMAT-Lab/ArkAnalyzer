# arkanalyzer cg（详细）

## 命令签名

```bash
arkanalyzer cg <input> [options]
```

- `<input>`：工程根目录
- 输出：`stdout`（默认）或 `-o` 指定文件

## 选项

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--algorithm <name>` | `-a` | 构建算法：`cha`、`rta` | `rta` |
| `--output <file>` | `-o` | 输出文件路径（`stdout` 表示标准输出） | `stdout` |
| `--format <type>` | `-f` | 输出格式：`json`、`text`、`dot`、`csv` | `json` |
| `--entry <method>` | `-e` | 指定入口方法（可多次使用） | 自动推断 |
| `--reachable-from <method>` | `-r` | 可达性分析起点（可多次使用） | 不启用可达性裁剪 |
| `--direction <dir>` | — | 分析方向：`forward`、`backward` | `forward` |
| `--edges <type>` | — | 边过滤：`call`、`virtual`、`interface`、`all` | `all` |
| `--ohos-sdk-home <path>` | — | OHOS SDK 根路径（回退到 `OHOS_SDK_HOME`） | 未设置 |

## 方法引用规则（`-e/-r`）

应用默认入口函数为 `@dummyMain`（未显式指定 `-e/--entry` 时按工具默认入口推断）。

1. 完整签名（最稳妥，和 `MethodSignature#toString()` 一致）
2. `ClassName.methodName`（必须唯一）
3. 唯一子串（必须唯一；不唯一会报歧义错误）

## 输出语义

- `json`：结构化结果（`entry`、`reachable`、`nodes`、`edgeCount`、`edgesData` 等）
  - `reachable`：以 `-r/--reachable-from` 指定方法为起点，在当前 `--direction` 与 `--edges` 约束下得到的可达方法签名集合（may-reach）。
- `text`：摘要 + 边列表
- `dot`：Graphviz DOT
- `csv`：`src,dst,type` 边表

> 注意：
> - `cg` 当前始终执行 `Scene.inferTypes()`。

## 示例

```bash
# 1) 全量调用图（JSON）
arkanalyzer cg ./myapp -a rta -f json

# 2) 逆向可达（谁能到达 Dog.sound）
arkanalyzer cg ./myapp -r "Dog.sound" --direction backward -f text

# 3) 仅导出虚调用边
arkanalyzer cg ./myapp --edges virtual -f dot -o ./out/cg.dot
```
