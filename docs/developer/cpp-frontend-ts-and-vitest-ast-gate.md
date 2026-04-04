# C++ 前端 TypeScript 修复、CXX 修饰符与 core_cpp 测试门禁

## 1. 需求 / Bug 描述

- **TypeScript 编译失败**：`ValueInference` 中 `instanceof` 使用的类型未导入；`Const` 缺少 `ANONYMOUS_NAMESPACE_PREFIX`；`ArkMethodBuilder` 中 `returnType` 被窄化为 `UnknownType`；`ArkValueTransformer` 在 `Type` 上调用受保护的 `getTypeString()`；`tests/unit/common` 缺少 `showCfgStmt`、`testBlocksWithSignature`。
- **C++ 前端建模**：匿名命名空间命名需要统一前缀常量；`ModifierType` 需覆盖 C++ 关键字对应的修饰（与 `MODIFIER_KIND_2_ENUM_CXX` 等用法一致）。
- **测试与打包**：`tests/unit/core_cpp` 依赖本机构建的 **astJsonDumper**；在未放置可执行文件时，Vitest 应跳过该目录避免误报失败。`prepack` 需将 `arkCppAst` 资源拷贝到 `lib/ast`，与运行时查找路径一致。

## 2. 设计方案

| 方向 | 说明 |
|------|------|
| 类型与 API | `ValueInference` 从 `../base/Type` 补充 `UnknownType`、`UnclearReferenceType`、`NullType`、`UndefinedType` 导入。 |
| 常量 | `ANONYMOUS_NAMESPACE_PREFIX = NAME_PREFIX + 'AN'`，供 `ModelUtils` / `ArkNamespaceBuilder` 使用。 |
| `Type` 字符串化 | 外部代码改用公开方法 `toString()`，避免访问 `protected getTypeString()`。 |
| 方法返回类型 | `ArkMethodBuilder` 使用 `let returnType: Type = UnknownType.getInstance()` 显式加宽类型。 |
| 单元测试辅助 | `testBlocksWithSignature` 按 `MethodSubSignature.toString()` 匹配重载；本地 `showCfgStmt` 供调试打印。 |
| astJsonDumper 门禁 | 在 `src/cpp_frontend/ast/const.ts` 提供 `getAstJsonDumperPath()`、`isAstJsonDumperAvailable()`；`vitest.config.ts` 在不可用时 `exclude: tests/unit/core_cpp/**` 并 `console.warn`。 |
| 打包 | `package.json` 的 `prepack` 追加 `npx copyfiles -f arkCppAst/* lib/ast`。 |
| 文档 | `src/cpp_frontend/ast/README.md` 说明 core_cpp 与 astJsonDumper 路径关系。 |

**兼容性**：未引入破坏性 API 变更；无 astJsonDumper 时仅跳过 core_cpp 用例，其余测试行为不变。

## 3. 测试方案

- 本地执行 `npm run build`（`tsc` 无报错）。
- 本地执行 `npm run testonce` 或 `npm test`：无 astJsonDumper 时应跳过 `tests/unit/core_cpp`，总用例数与控制台提示符合预期；存在二进制时应包含 core_cpp 用例。
- 回归：其余 `tests/unit` 用例通过。

## 4. Commit 描述

```
fix(core,cpp): TS build fixes, CXX modifiers, vitest gate for core_cpp

- Import missing Type variants in ValueInference; add ANONYMOUS_NAMESPACE_PREFIX
- Use Type.toString() in ArkValueTransformer; widen returnType in ArkMethodBuilder
- Add CXX-specific ModifierType flags in ArkBaseModel
- Export astJsonDumper path helpers; skip tests/unit/core_cpp when binary missing
- Add testBlocksWithSignature/showCfgStmt; prepack copies arkCppAst to lib/ast
```

（实际提交以 `git log -1` 为准，须带 `Signed-off-by`。）

## 5. PR 描述

### 1 内容说明

修复 C++ 前端与核心推理相关 TypeScript 错误，补齐 C++ 修饰符枚举；使 Vitest 在未构建 astJsonDumper 时自动跳过 `tests/unit/core_cpp`，并在 README 中说明依赖关系；`prepack` 同步拷贝 AST 资源到 `lib/ast`。

### 2 变更点

- `src/core/inference/ValueInference.ts`、`src/core/common/Const.ts`、`src/core/model/ArkBaseModel.ts`
- `src/cpp_frontend/ast/const.ts`、`src/cpp_frontend/ast/README.md`
- `src/cpp_frontend/common/ArkValueTransformer.ts`、`src/cpp_frontend/model/builder/ArkMethodBuilder.ts`
- `tests/unit/common.ts`、`vitest.config.ts`、`package.json`

### 3 自测点

- `npm run build`：通过。
- `npm run testonce`：通过（无 astJsonDumper 时跳过 core_cpp，控制台有提示）。

### 4 测试关注点

- 已安装 astJsonDumper 的开发者应确认 `tests/unit/core_cpp` 仍被收集并执行。
- 发布流程中 `npm pack` / `prepack` 后检查 `lib/ast` 是否包含 `arkCppAst` 拷贝内容。
