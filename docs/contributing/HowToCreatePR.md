# 中文 
本指导是对[openharmony-sig提交代码规范](https://gitee.com/openharmony-sig/sig-content/blob/master/Infrastructure/docs/manual/gitee%E6%8F%90pr%E5%B8%B8%E8%A7%84%E6%93%8D%E4%BD%9C.md)的扩充

开发者对仓库修改，统一采用向对应仓库提PR的方式来做修改。提PR的方式有两种：
1. fork工作仓方式：相关的gitee操作请参考此[链接](https://gitee.com/help/articles/4128#article-header0)。
2. 评审模式：直接向主仓push代码，gitee自动生成PR。相关的操作参考此[链接](https://gitee.com/help/articles/4346)。

以下为一次提交代码的步骤：
1. **最重要**：提交代码时一定要记得使用git commit -s -m添加signed-off信息，且signed-off中涉及到的邮箱已经在[链接](https://dco.openharmony.io/sign/Z2l0ZWUlMkZvcGVuX2hhcm1vbnk=)中签署DCO

2. 使用`git push origin <分支名>`将指定分支的本地仓库内容推到远端开发者fork仓库（fork工作仓方式）或远端主仓（评审模式）

3. fork工作仓方式：进入远端fork 的仓库，点击新建PR,选择第2步中提交的分支。评审模式：一个PR会自动创建

4. 在主仓新建ISSUE，ISSUE的类型和内容根据提交的代码特性按实际填写
   
5. 在PR页面右边栏的“关联ISSUE”选择第4步创建的ISSUE（不关联无法触发门禁）
   
6. 在PR页面右边栏选择审查人员
   
7. 在评论中输入`start build`，几秒后会触发门禁
    
8. 等待门禁后台审核

   * 如果提交的PR显示DCO检查成功，等待管理员审核通过即可，如果DCO检查失败，请确认是否签署DCO。

   * 提交以后，后台会进行自动化的法务合规、cicd的扫描，扫描结果会在提交的PR下以评论的形式展现出来

   * 如果扫描有问题，需要根据反馈进行整改，然后再重新提交，直到审核通过
  
9. 门禁全部通过和人员审查通过后，会自动合并代码

***
# ENGLISH
This guide is an expansion of the code submission standards of openharmony-sig.

Developers should make modifications to the repository by submitting a PR (Pull Request) to the corresponding repository. There are two ways to submit a PR:

1. Fork repository method: For related Gitee operations, please refer to this [link](https://gitee.com/help/articles/4128#article-header0).
2. Review mode: Directly push the code to the main repository, and Gitee will automatically generate a PR. For related operations, please refer to this [link](https://gitee.com/help/articles/4346).
   
Here are the steps for a code submission:

1. **Most importantly**: When committing code, always remember to use `git commit -s -m` to add signed-off information, and ensure that the email involved in the signed-off has signed the DCO (Developer Certificate of Origin) as [linked](https://dco.openharmony.io/sign/Z2l0ZWUlMkZvcGVuX2hhcm1vbnk=).
2. Use `git push origin <branch-name>` to push the content of the specified branch in your local repository to the remote developer's forked repository (fork repository method) or to the remote main repository (review mode).
3. Fork repository method: Enter the remote forked repository and click on "New Pull Request", selecting the branch submitted in step 2. Review mode: A PR will be automatically created.
4. Create a new ISSUE in the main repository, and fill in the type and content of the ISSUE according to the features of the submitted code.
5. On the right side of the PR page, under "Associated ISSUE", select the ISSUE created in step 4 (it cannot trigger the gate if not associated).
6. On the right side of the PR page, select the reviewer.
7. Enter "start build" in the comments to trigger the gate after a few seconds.
8. Wait for the gate to be reviewed in the background.
   * If the submitted PR shows that the DCO check is successful, wait for the administrator to review and pass. If the DCO check fails, please confirm whether you have signed the DCO.
   * After submission, the background will carry out automated legal compliance and CI/CD scanning, and the results of the scan will be displayed in the form of comments under the submitted PR.
   * If there are problems with the scan, they need to be rectified according to the feedback and then resubmitted until the review is passed.
9. After all gates pass and the personnel review is passed, the code will be automatically merged.