import taskpool from '@ohos.taskpool';

let task: taskpool.Task = new taskpool.Task("10",a, 100);
taskpool.cancel(task);