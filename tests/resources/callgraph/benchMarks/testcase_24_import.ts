import { MacDonlad } from './lib/c';
import taskpool from '@ohos.taskpool';
import AbilityDelegatorRegistry from '@ohos.app.ability.abilityDelegatorRegistry';
/**
 * 8/12
 * 3/4
 * testcase_24_import.ts
 */

let macDonlad = new MacDonlad()
let notCat = macDonlad.dog

let task: taskpool.Task = new taskpool.Task("10",a, 100);

abilityDelegatorArguments = AbilityDelegatorRegistry.getArguments()
abilityDelegator = AbilityDelegatorRegistry.getAbilityDelegator()

function a(){}