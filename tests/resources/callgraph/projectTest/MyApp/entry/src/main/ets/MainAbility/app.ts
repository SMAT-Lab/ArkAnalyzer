let __generate__Id: number = 0;
function generateId(): string {
    return "app_" + ++__generate__Id;
}
import hilog from '@ohos.hilog';
export default {
    onCreate() {
        hilog.isLoggable(0x0000, 'testTag', hilog.LogLevel.INFO);
        hilog.info(0x0000, 'testTag', '%{public}s', 'Application onCreate');
    },
    onDestroy() {
        hilog.isLoggable(0x0000, 'testTag', hilog.LogLevel.INFO);
        hilog.info(0x0000, 'testTag', '%{public}s', 'Application onDestroy');
    },
};
