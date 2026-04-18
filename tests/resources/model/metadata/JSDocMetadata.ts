/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * namespace jsdoc
 * @namespace JsDocNamespace
 * @syscap SystemCapability.Communication.Bluetooth.Core
 * @since 7
 * @deprecated since 9
 * @useinstead ohos.bluetoothManager
 */
declare namespace JsDocNamespace {
    /**
     * Base interface of profile.
     *
     * @typedef BaseProfile
     * @syscap SystemCapability.Communication.Bluetooth.Core
     * @since 7
     * @deprecated since 9
     * @useinstead ohos.bluetoothManager/bluetoothManager.BaseProfile
     */
    interface JsDocInterface {
        /**
         * method jsdoc in interface
         *
         * @permission ohos.permission.USE_BLUETOOTH
         * @returns { BluetoothState } Returns the Bluetooth status, which can be {@link BluetoothState#STATE_OFF},
         * {@link BluetoothState#STATE_TURNING_ON}, {@link BluetoothState#STATE_ON}, {@link BluetoothState#STATE_TURNING_OFF},
         * {@link BluetoothState#STATE_BLE_TURNING_ON}, {@link BluetoothState#STATE_BLE_ON},
         * or {@link BluetoothState#STATE_BLE_TURNING_OFF}.
         * @syscap SystemCapability.Communication.Bluetooth.Core
         * @since 7
         * @deprecated since 9
         * @useinstead ohos.bluetoothManager/bluetoothManager.getState
         */
        run(): BluetoothState;
    }

    /**
     * The definition of AI Agent controller.
     *
     * @syscap SystemCapability.AI.Agent.AgentKit
     * @since 6.0.0(20)
     */
    /**
     * The definition of AI Agent controller.
     *
     * @syscap SystemCapability.AI.Agent.AgentKit
     * @atomicservice
     * @since 6.0.1(21)
     */
    export class JsDocClass {
        /**
         * If agent kit is supported for the application
         * @param { common.UIAbilityContext } context - the context of application.
         * @param { string } agentId - the agent ID.
         * @returns { Promise<boolean> }.
         * @throws { BusinessError } 1022400010 - Parameter error.
         * @throws { BusinessError } 1022400011 - Privacy agreement not accepted.
         * @throws { BusinessError } 1022400013 - Internet error.
         * @throws { BusinessError } 1022400014 - Internal error.
         * @syscap SystemCapability.AI.Agent.AgentKit
         * @since 6.0.0(20)
         */
        /**
         * If agent kit is supported for the application
         * @param { common.UIAbilityContext } context - the context of application.
         * @param { string } agentId - the agent ID.
         * @returns { Promise<boolean> }.
         * @throws { BusinessError } 1022400010 - Parameter error.
         * @throws { BusinessError } 1022400011 - Privacy agreement not accepted.
         * @throws { BusinessError } 1022400013 - Internet error.
         * @throws { BusinessError } 1022400014 - Internal error.
         * @syscap SystemCapability.AI.Agent.AgentKit
         * @atomicservice
         * @since 6.0.1(21)
         */
        run(): void {
        }
    }
}
