## 1. Issue 分类

所有新提交的 Issue 应该根据其类型进行分类。主要的分类包括：

* Bug
* 新功能需求
* 疑问/支持请求
* 任务

## 2. 初步筛选

当一个新的 Issue 被提交时，项目维护者应执行以下初步筛选步骤：

1. **确认 Issue 描述是否清晰**：确保 Issue 的描述清晰并包含足够的信息。若描述不清晰，向提问者请求更多信息。
2. **确认 Issue 分类是否正确**：检查 Issue 的分类是否正确，如果不正确，重新分类。

## 3. 处理流程

根据 Issue 的分类，采取不同的处理流程。
各环节需要补充责任人

### A. Bug

1. **验证 Bug**
   * 重现问题：尝试重现提到的问题，若为问题，打上标签跟踪。
   * 收集更多信息：如果需要更多信息（如日志、错误消息、环境配置等），请求提问者提供。
2. **优先级排序**
   * 根据 Bug 的严重程度和影响范围，分配优先级。必解问题标为严重，例行跟踪。
3. **分配处理**
   * 指派给合适的开发人员进行处理。
4. **修复 Bug**
   * 开发人员修复 Bug 并提交 PR。
5. **测试和关闭**
   * 测试修复的有效性。
   * 合并 PR 后关闭 Issue，并通知提问者。

### B. 新功能需求

1. **评估需求**
   * 讨论需求的可行性和价值，若有价值录入版本需求。
   * 收集社区和团队的反馈。
2. **优先级排序**
   * 根据项目的目标和资源分配优先级。
3. **分配处理**
   * 如果决定实施，指派给合适的开发人员进行设计和开发。
4. **开发新功能**
   * 开发人员设计、开发并提交 PR。
5. **测试和发布**
   * 测试新功能，确保其符合要求。
   * 合并 PR 并更新文档后关闭 Issue，并通知提问者。

### C. 疑问/支持请求

1. **回应提问**
   * 及时回应提问，提供解决方案或指导。
   * 如果问题已在文档中详细说明，提供相关链接。
2. **解决疑问**
   * 如果问题复杂，需要进一步讨论和调查，可能需要分配给合适的人员。
3. **关闭 Issue**
   * 一旦问题得到解决或指导，关闭 Issue，并通知提问者。

## 4. 通用规范

* **响应时间**：尽量在 48 小时内响应新 Issue。
* **沟通**：保持透明开放的沟通，确保 Issue 创建者了解 Issue 的处理进展。
* **文档更新**：根据 Issue 处理过程中的发现和解决方案，及时更新项目文档。
* **定期检查**：定期检查未关闭的 Issue，确保所有问题都得到适当处理。
* **审核人**： [xulingyun-red](https://gitee.com/xulingyun-red)、[sfoolish](https://gitee.com/sfoolish)。
* **标题**：标题可以添加tag方便查看，如[#arkcheckxx]、[#IRRefactorxx]。
* **标签**：
  * `Accept`: 审核通过。
  * `Duplicate`: 重复Issue，注明重复的Issue号，并关闭。
  * `Reject`: 拒绝Issue，注明拒绝理由（e.g. issue描述不清楚，长期未回复）。

## 5. Milestone管理

* 每月一个里程碑，里程碑名：M-YYYYMM
* 月度版本需求和必解问题相关Issue标注Milestone和等级
* 每月10日锁定当月的必交需求和必解问题，10日后的新增问题单独评估是否必解(遇到周末提前锁定)
* 每月25日初步锁定下个月的必交需求和必解问题，25日后的新增需求单独评估是否必交(遇到周末提前锁定)
* 加入Milestone的Issue等级：严重(转测前合入) > 主要(转测后可以合入) > 次要(可以遗留) > 不重要(可以遗留)

## 6. 模板和标签

为帮助开发/测试人员提交有效的 Issue，可以使用模板和标签：

### Issue 模板

**1.BUG模版/缺陷**

```
**【简要描述 / Description】：**

**【测试步骤 / Test procedure】：**

**【预期结果 / Expected result】：**

**【实际结果 / Actual result】：**

**【其它 / Others】：**
- 1. Log、截图、多媒体文件等，所有和问题有关的信息：


e.g.: https://gitee.com/openharmony-sig/arkanalyzer/issues/IAC3AX
```

**2.需求模版**

```
**【需求价值 / Value of the Requirement】：**

**【需求描述 / Requirement Description】：**

**【方案描述 / Solution Description】：**

**【配套文档 / Supporting Documentation】：**

**【验收标准 / Acceptance Criteria】：**

e.g.: https://gitee.com/openharmony-sig/arkanalyzer/issues/IACEBC
```

**3.任务模版**

```
**【任务描述 / Task Description】：**

**【解决方案 / Solution Description】：**

**【任务来源 / Task Source】：**
```

## 7. 其它开发过程规范

### A. 分支管理规范

* 所有代码必须先合主干，再合商分。（特性分支除外，特性分支代码开发完后，也需要先回合主干再按需合入商分）
* gitee与codehub同步创建月度Release分支，Release分支匹配Milestone的需求和必解问题交付。
* 月度首版本转测后，release分支只合必解问题不合需求，不夹带合入。
* 底座月度分支合入需要[sfoolish](https://gitee.com/sfoolish)审核，影响对外接口的同时需要[yifei-xue](https://gitee.com/yifei_xue)审核，接口文档需要yanglin审核。

### B. PR提交规范

* 代码合入前先Rebase
* 代码PR需要刷新，建议通过`git commit --amend` + `git push -f` 刷新，想在主干保留中间状态，建议分多次PR提交
* 新建的PR提交后都发到review群里

### C. 代码检视 CheckList

1. PR关联的issue已审核且处于open状态。
2. issue描述、PR描述与代码实际修改保持一致。
3. 对于一个问题或者需求的提交，不能夹带其它问题或需求的修改。
4. 门禁问题和检视意见必须全部处理完毕。
5. 代码保持一定比例的注释，确保在充分理解代码修改的情况下对代码进行检视和合入。
6. bugfix类PR默认要补充UT用例。
