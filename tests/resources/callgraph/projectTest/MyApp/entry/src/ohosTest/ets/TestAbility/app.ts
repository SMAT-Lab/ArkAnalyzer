let __generate__Id: number = 0;
function generateId(): string {
    return "app_" + ++__generate__Id;
}
import hilog from '@ohos.hilog';
import AbilityDelegatorRegistry from '@ohos.application.abilityDelegatorRegistry';
import { Hypium } from '@ohos/hypium';
import testsuite from '../test/List.test';
export default {
    onCreate() {
        hilog.isLoggable(0x0000, 'testTag', hilog.LogLevel.INFO);
        hilog.info(0x0000, 'testTag', '%{public}s', 'Application onCreate');
        var abilityDelegator: any;
        abilityDelegator = AbilityDelegatorRegistry.getAbilityDelegator();
        var abilityDelegatorArguments: any;
        abilityDelegatorArguments = AbilityDelegatorRegistry.getArguments();
        hilog.info(0x0000, 'testTag', '%{public}s', 'start run testcase!!!');
        Hypium.hypiumTest(abilityDelegator, abilityDelegatorArguments, testsuite);
    },
    onDestroy() {
        hilog.isLoggable(0x0000, 'testTag', hilog.LogLevel.INFO);
        hilog.info(0x0000, 'testTag', '%{public}s', 'Application onDestroy');
    },
};
loadDocument(new FoodDetail("21", undefined, {}));
