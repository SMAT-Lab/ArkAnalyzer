# GitHub Actions 流水线说明

## npm pack & publish

### 触发条件

- **push** 到 `main` 或 `master`：执行 `npm pack`，产物上传为 artifact
- **Release 发布**：在 pack 基础上执行 `npm publish` 发布到 npm
- **手动触发**：`workflow_dispatch` 可手动运行

### 发布到 npm 前置条件

1. 在 [npmjs.com](https://www.npmjs.com/) 创建账号并登录
2. 生成 Access Token：Account → Access Tokens → Generate New Token
3. 在 GitHub 仓库设置中添加 Secret：`NPM_TOKEN` = 上述 token

### 发布流程

1. 在 GitHub 创建 Release（Tag 建议与 `package.json` 的 `version` 一致）
2. 流水线自动执行 pack → publish
3. 在 npm 上查看发布结果：https://www.npmjs.com/package/arkanalyzer
