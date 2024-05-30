import taskpool from '@ohos.taskpool';
import AbilityDelegatorRegistry from '@ohos.app.ability.abilityDelegatorRegistry';


let task: taskpool.Task = new taskpool.Task("10",a, 100);

abilityDelegatorArguments = AbilityDelegatorRegistry.getArguments()
abilityDelegator = AbilityDelegatorRegistry.getAbilityDelegator()