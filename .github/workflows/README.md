# GitHub Actions 流水线说明

## npm pack & publish

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

### 发布流程

1. **GitCode 代码镜像到 GitHub**：执行 `./script/mirror-to-github.sh`，将主分支推送到 GitHub 的 mirror 分支
2. 在 GitHub 创建 Release（Tag 建议与 `package.json` 的 `version` 一致）
3. 流水线自动执行 pack → publish
4. 在 npm 上查看发布结果：https://www.npmjs.com/package/arkanalyzer
