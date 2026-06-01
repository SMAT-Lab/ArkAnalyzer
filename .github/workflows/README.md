# GitHub Actions 流水线说明

## npm pack & publish

### CI 运行环境（偏稳定，非 latest）

| 用途 | Runner / 版本 |
|------|----------------|
| Linux x64 编译 | `ubuntu-22.04` + apt.llvm.org **jammy** / LLVM 19 |
| Linux arm64 编译 | `ubuntu-22.04-arm` + apt.llvm.org **jammy** / LLVM 19 |
| Windows 编译 | `windows-2022`：MSYS2 装 LLVM/CMake，`npm run build:cpp` 在 **PowerShell**（与本地一致） |
| macOS 编译 | `macos-14` + Homebrew llvm@19 |
| pack / publish | `ubuntu-22.04`，Node.js **24** LTS |
| Actions | `checkout`/`setup-node` **@v5**；`upload-artifact` **@v6**；`download-artifact` **@v7**（Node 24 runtime） |

说明：GitHub 托管 runner 已不提供 `ubuntu-20.04`；本地/Docker 仍可用 20.04，CI 用 22.04 避免 job 长期排队。

### 触发条件

- **push** 到 `mirror`：执行 `npm pack`，产物上传为 artifact
- **Release 发布**：在 pack 基础上执行 `npm publish` 发布到 npm
- **手动触发**：`workflow_dispatch` 可手动运行

### 发布到 npm 前置条件

1. 在 [npmjs.com](https://www.npmjs.com/) 创建账号并登录
2. 生成 **Automation** Token（重要：若账号开启 2FA，必须用 Automation 类型，否则会报 EOTP 错误）
   - Account → Access Tokens → Generate New Token
   - 选择 **Bypass tow-factor authentication(2FA)** 类型（CI 发布无需 OTP）
3. 在 GitHub 仓库设置中添加 Secret：`NPM_TOKEN` = 上述 token

### 验证 npm 包（主包 / 平台 C++ 包）

在**对应系统**上运行（Linux 用 `linux-x64` 或 `linux-arm64` tgz，Windows 用 `win32-x64` tgz；无需本机 LLVM）：

```bash
ARKANALYZER_VERIFY_NPM_PACK=1 npx ts-node tests/samples/NpmPackVerifyTest.ts \
  --main-tgz /path/to/arkanalyzer-1.0.90.tgz \
  --cxx-tgz /path/to/arkanalyzer-cxx-ast-parser-<platform>-<arch>-1.0.90.tgz
```

默认 CI 会跑 `tests/samples/` 下脚本；本用例未设置 `ARKANALYZER_VERIFY_NPM_PACK=1` 时会立即退出（exit 0），不安装 tgz、不跑检查。

检查项：① 仅主包构建 ArkTS Scene；② 平台包 `AstParser.runCppAst` 解析 `minimal.cpp`；③ 主包 + 平台包走 Scene C++ 前端。

### 发布流程

1. **GitCode 代码镜像到 GitHub**：执行 `./script/mirror-to-github.sh`，将主分支推送到 GitHub 的 mirror 分支
2. 在 GitHub 创建 Release（Tag 建议与 `package.json` 的 `version` 一致）
3. 流水线自动执行 pack → publish
4. 在 npm 上查看发布结果：https://www.npmjs.com/package/arkanalyzer
