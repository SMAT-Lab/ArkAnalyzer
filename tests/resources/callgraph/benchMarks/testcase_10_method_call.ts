// test case for method call 1
// 5/6
// 0/1
// testcase_10_method_call.ts

import taskpool from '@ohos.taskpool';

let task: taskpool.Task = new taskpool.Task("10",a, 100); // 100: test number
// TODO: 需要看下constructor方法没有被推断出来，以及a被看作了变量，但是没有类型

function a() {}