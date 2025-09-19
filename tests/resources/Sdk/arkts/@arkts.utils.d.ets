/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
 * @file Defines the utils for ArkTS
 * @kit ArkTS
 */

import lang from './@arkts.lang';

/**
 * @namespace utils
 * @syscap SystemCapability.Utils.Lang
 * @atomicservice
 * @since 12
 */
/**
 * @namespace utils
 * @syscap SystemCapability.Utils.Lang
 * @crossplatform
 * @atomicservice
 * @since 18
 */
declare namespace utils {
  /**
   * Asynchronous lock.
   *
   * @namespace locks
   * @syscap SystemCapability.Utils.Lang
   * @atomicservice
   * @since 12
   */
  /**
   * Asynchronous lock.
   *
   * @namespace locks
   * @syscap SystemCapability.Utils.Lang
   * @crossplatform
   * @atomicservice
   * @since 18
   */
  namespace locks {
    /**
     * Type of callback for asyncLock operation.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Type of callback for asyncLock operation.
     *
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    type AsyncLockCallback<T> = () => T | Promise<T>;

    /**
     * Class to execute an asynchronous operation under lock.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Class to execute an asynchronous operation under lock.
     *
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    @Sendable
    class AsyncLock {
      /**
       * Default constructor.
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Default constructor.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      constructor();
      /**
       * Find or create an instance of AsyncLock using the specified name.
       *
       * @param { string } name - name of the lock to find or create.
       * @returns { AsyncLock } Returns an instance of AsyncLock.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Find or create an instance of AsyncLock using the specified name.
       *
       * @param { string } name - name of the lock to find or create.
       * @returns { AsyncLock } Returns an instance of AsyncLock.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      static request(name: string): AsyncLock;

      /**
       * Query information about the specified lock.
       *
       * @param { string } name - name of the lock.
       * @returns { AsyncLockState } Returns an instance of AsyncLockState.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Query information about the specified lock.
       *
       * @param { string } name - name of the lock.
       * @returns { AsyncLockState } Returns an instance of AsyncLockState.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      static query(name: string): AsyncLockState;

      /**
       * Query information about all locks.
       *
       * @returns { AsyncLockState[] } Returns an array of AsyncLockState.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Query information about all locks.
       *
       * @returns { AsyncLockState[] } Returns an array of AsyncLockState.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      static queryAll(): AsyncLockState[];

      /**
       * Perform an operation with the acquired lock exclusively.
       * The method acquires the lock first, then calls the callback, and then releases the lock.
       * The callback is called asynchronously in the same thread where lockAsync was called.
       *
       * @param { AsyncLockCallback<T> } callback - function to call when the lock gets acquired.
       * @returns { Promise<T> } Promise that will be resolved after the callback gets executed.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Perform an operation with the acquired lock exclusively.
       * The method acquires the lock first, then calls the callback, and then releases the lock.
       * The callback is called asynchronously in the same thread where lockAsync was called.
       *
       * @param { AsyncLockCallback<T> } callback - function to call when the lock gets acquired.
       * @returns { Promise<T> } Promise that will be resolved after the callback gets executed.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      lockAsync<T>(callback: AsyncLockCallback<T>): Promise<T>;

      /**
       * Perform an operation with the acquired lock.
       * The method acquires the lock first, then calls the callback, and then releases the lock.
       * The callback is called asynchronously in the same thread where lockAsync was called.
       *
       * @param { AsyncLockCallback<T> } callback - function to call when the lock gets acquired.
       * @param { AsyncLockMode } mode - mode of the lock operation.
       * @returns { Promise<T> } Promise that will be resolved after the callback gets executed or rejected.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Perform an operation with the acquired lock.
       * The method acquires the lock first, then calls the callback, and then releases the lock.
       * The callback is called asynchronously in the same thread where lockAsync was called.
       *
       * @param { AsyncLockCallback<T> } callback - function to call when the lock gets acquired.
       * @param { AsyncLockMode } mode - mode of the lock operation.
       * @returns { Promise<T> } Promise that will be resolved after the callback gets executed or rejected.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      lockAsync<T>(callback: AsyncLockCallback<T>, mode: AsyncLockMode): Promise<T>;

      /**
       * Perform an operation with the acquired lock.
       * The method acquires the lock first, then calls the callback, and then releases the lock.
       * The callback is called asynchronously in the same thread where lockAsync was called.
       * An optional timeout value can be provided in {@link AsyncLockOptions}. In this case, lockAsync will reject the
       * resulting promise with a BusinessError instance if the lock is not acquired before timeout exceeds.
       * The error message, in this case, will contain the held and waited locks information and possible deadlock
       * warnings.
       *
       * @param { AsyncLockCallback<T> } callback - function to call when the lock gets acquired.
       * @param { AsyncLockMode } mode - mode of the lock operation.
       * @param { AsyncLockOptions<U> } options - lock operation options.
       * @returns { Promise<T | U> } Promise that will be resolved after the callback gets executed or rejected in case
       *     timeout exceeded.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @throws { BusinessError } 10200031 - Timeout exceeded.
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Perform an operation with the acquired lock.
       * The method acquires the lock first, then calls the callback, and then releases the lock.
       * The callback is called asynchronously in the same thread where lockAsync was called.
       * An optional timeout value can be provided in {@link AsyncLockOptions}. In this case, lockAsync will reject the
       * resulting promise with a BusinessError instance if the lock is not acquired before timeout exceeds.
       * The error message, in this case, will contain the held and waited locks information and possible deadlock
       * warnings.
       *
       * @param { AsyncLockCallback<T> } callback - function to call when the lock gets acquired.
       * @param { AsyncLockMode } mode - mode of the lock operation.
       * @param { AsyncLockOptions<U> } options - lock operation options.
       * @returns { Promise<T | U> } Promise that will be resolved after the callback gets executed or rejected in case
       *     timeout exceeded.
       * @throws { BusinessError } 401 - The input parameters are invalid.
       * @throws { BusinessError } 10200030 - The lock does not exist.
       * @throws { BusinessError } 10200031 - Timeout exceeded.
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      lockAsync<T, U>(callback: AsyncLockCallback<T>, mode: AsyncLockMode,
        options: AsyncLockOptions<U>): Promise<T | U>;

      /**
       * Name of the lock.
       *
       * @type { string }
       * @readonly
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Name of the lock.
       *
       * @type { string }
       * @readonly
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      readonly name: string;
    }

    /**
     * Mode of lock operations.
     *
     * @enum { number } AsyncLockMode
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Mode of lock operations.
     *
     * @enum { number } AsyncLockMode
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    enum AsyncLockMode {
      /**
       * Shared lock operation.
       * The operation could reenter if this mode is specified. 
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Shared lock operation.
       * The operation could reenter if this mode is specified.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      SHARED = 1,
      /**
       * Exclusive lock operation.
       * If this mode is specified, the operation is executed only when the lock is acquired exclusively.
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Exclusive lock operation.
       * If this mode is specified, the operation is executed only when the lock is acquired exclusively.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      EXCLUSIVE = 2,
    }

    /**
     * Lock operation's options
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Lock operation's options
     *
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    class AsyncLockOptions<T> {
      /**
       * Default constructor.
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Default constructor.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      constructor();

      /**
       * If the value is true and lockAsync cannot acquire the lock immediately, the operation is canceled.
       *
       * @type { boolean }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * If the value is true and lockAsync cannot acquire the lock immediately, the operation is canceled.
       *
       * @type { boolean }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      isAvailable: boolean;
      /**
       * The object used to abort the async operation. If signal.aborted is true, the callback will not be called.
       *
       * @type { AbortSignal<T> | null }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * The object used to abort the async operation. If signal.aborted is true, the callback will not be called.
       *
       * @type { AbortSignal<T> | null }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      signal: AbortSignal<T> | null;
      /**
       * Lock operation timeout in milliseconds. If it is greater than zero, lockAsync will reject the resulting promise
       * when the timeout is exceeded.
       *
       * @type { number }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Lock operation timeout in milliseconds. If it is greater than zero, lockAsync will reject the resulting promise
       * when the timeout is exceeded.
       *
       * @type { number }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      timeout: number;
    }

    /**
     * Information about all lock operations on the AsyncLock instance.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Information about all lock operations on the AsyncLock instance.
     *
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    class AsyncLockState {
      /**
       * Held locks information.
       *
       * @type { AsyncLockInfo[] }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Held locks information.
       *
       * @type { AsyncLockInfo[] }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      held: AsyncLockInfo[];
      /**
       * Pending locks information.
       *
       * @type { AsyncLockInfo[] }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Pending locks information.
       *
       * @type { AsyncLockInfo[] }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      pending: AsyncLockInfo[];
    }

    /**
     * Information about a lock.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Information about a lock.
     *
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    class AsyncLockInfo {
      /**
       * Name of the lock.
       *
       * @type { string }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Name of the lock.
       *
       * @type { string }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      name: string;
      /**
       * Lock operation mode.
       *
       * @type { AsyncLockMode }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Lock operation mode.
       *
       * @type { AsyncLockMode }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      mode: AsyncLockMode;
      /**
       * lockAsync caller's execution context identifier.
       *
       * @type { number }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * lockAsync caller's execution context identifier.
       *
       * @type { number }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      contextId: number;
    }

    /**
     * Object used to abort an async operation.
     * An instance of this class must be accessed in the same thread where the instance is created.
     * Access to fields of this class from another thread is undefined behaviour.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Object used to abort an async operation.
     * An instance of this class must be accessed in the same thread where the instance is created.
     * Access to fields of this class from another thread is undefined behaviour.
     *
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    class AbortSignal<T> {
      /**
       * Set to true to abort an operation.
       *
       * @type { boolean }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Set to true to abort an operation.
       *
       * @type { boolean }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      aborted: boolean;

      /**
       * Reason for the abort. This value will be used to reject the promise returned from lockAsync.
       *
       * @type { T }
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 12
       */
      /**
       * Reason for the abort. This value will be used to reject the promise returned from lockAsync.
       *
       * @type { T }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      reason: T
    }

    /**
     * Object used for thread synchronization.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    @Sendable
    class ConditionVariable {
      /**
       * Default constructor.
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 18
       */
      constructor()
      /**
       * Find or create an instance of ConditionVariable using the specified name.
       *
       * @param { string } name - Name of the ConditionVariable to find or create.
       * @returns { ConditionVariable } Returns an instance of ConditionVariable.
       * @static
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 18
       */
      static request(name: string): ConditionVariable;
      /**
       * Waits for the ConditionVariable to be notified.
       *
       * @returns { Promise<void> } A promise will be resolved once the ConditionVariable is notified..
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 18
       */
      wait(): Promise<void>;
      /**
       * Waits for the ConditionVariable to be notified, or until the specified time limit is reached.
       *
       * @param { number } timeout - The maximum time to wait.
       * @returns { Promise<void> } A promise that will be resolved once the ConditionVariable is notified or the
       * specified time limit is reached.
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 18
       */
      waitFor(timeout: number): Promise<void>;
      /**
       * Notify all waiting promise.
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 18
       */
      notifyAll(): void;
      /**
       * Notify one waiting promise.
       *
       * @syscap SystemCapability.Utils.Lang
       * @atomicservice
       * @since 18
       */
      notifyOne(): void;
    }
  }
  /**
   * ArkTS JSON utils.
   *
   * @namespace ASON
   * @syscap SystemCapability.Utils.Lang
   * @atomicservice
   * @since 12
   */
  /**
   * ArkTS JSON utils.
   *
   * @namespace ASON
   * @syscap SystemCapability.Utils.Lang
   * @crossplatform
   * @atomicservice
   * @since 18
   */
  namespace ASON {
    /**
     * Redefines ISendable for convenience.
     *
     * @typedef { lang.ISendable } ISendable
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Redefines ISendable for convenience.
     *
     * @typedef { lang.ISendable } ISendable
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    type ISendable = lang.ISendable;
    /**
    * The type of conversion result function.
    *
    * @typedef { function } Transformer
    * @param { ISendable } this - The ISendable to which the parsed key value pair belongs.
    * @param { string } key - Attribute name.
    * @param { ISendable | undefined | null } value - The value of the parsed key value pair.
    * @returns { ISendable | undefined | null } Return the modified ISendable or undefined or null.
    * @syscap SystemCapability.Utils.Lang
    * @atomicservice
    * @since 12
    */
    /**
     * The type of conversion result function.
     *
     * @typedef { function } Transformer
     * @param { ISendable } this - The ISendable to which the parsed key value pair belongs.
     * @param { string } key - Attribute name.
     * @param { ISendable | undefined | null } value - The value of the parsed key value pair.
     * @returns { ISendable | undefined | null } Return the modified ISendable or undefined or null.
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    type Transformer = (this: ISendable, key: string,
      value: ISendable | undefined | null) => ISendable | undefined | null
    /**
     * Converts a JavaScript Object Notation (JSON) string into an ArkTS Value.
     *
     * @param { string } text - A valid JSON string.
     * @param { Transformer } [reviver] - A function that transforms the results.
     * @param {ParseOptions} [options] - The config of parse.
     * @returns { ISendable | null } Return an ArkTS Value.
     * @throws { BusinessError } 401 - Parameter error. Invalid JSON string.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Converts a JavaScript Object Notation (JSON) string into an ArkTS Value.
     *
     * @param { string } text - A valid JSON string.
     * @param { Transformer } [reviver] - A function that transforms the results.
     * @param {ParseOptions} [options] - The config of parse.
     * @returns { ISendable | null } Return an ArkTS Value.
     * @throws { BusinessError } 401 - Parameter error. Invalid JSON string.
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    function parse(text: string, reviver?: Transformer, options?: ParseOptions): ISendable | null;
    /**
     * Converts an ArkTS value to a JavaScript Object Notation (JSON) string.
     *
     * @param { ISendable | null | undefined } value - The value to stringify.
     * @returns { string } The JSON string representation of the value.
     * @throws { BusinessError } 401 - Parameter error. Invalid ArkTS value.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 12
     */
    /**
     * Converts an ArkTS value to a JavaScript Object Notation (JSON) string.
     * Extra supports Map and Set.
     *
     * @param { Object | null | undefined } value - The value to stringify.
     * @returns { string } The JSON string representation of the value.
     * @throws { BusinessError } 401 - Parameter error. Invalid ArkTS value.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @crossplatform
     * @since 18
     */
    function stringify(value: Object | null | undefined): string;

    /**
    * Enum defining modes for handling bigint.
    *
    * @enum { number } BigIntMode
    * @syscap SystemCapability.Utils.Lang
    * @atomicservice
    * @since 12
    */
    /**
     * Enum defining modes for handling bigint.
     *
     * @enum { number } BigIntMode
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    const enum BigIntMode {
      /**
      * BigInt is not supported.
      *
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 12
      */
      /**
       * BigInt is not supported.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      DEFAULT = 0,
      /**
      * Parse as BigInt when number less than -(2^53 – 1) or greater than (2^53 – 1).
      *
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 12
      */
      /**
       * Parse as BigInt when number less than -(2^53 – 1) or greater than (2^53 – 1).
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      PARSE_AS_BIGINT = 1,
      /**
      * All numbers parse as BigInt.
      *
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 12
      */
      /**
       * All numbers parse as BigInt.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      ALWAYS_PARSE_AS_BIGINT = 2,
    }

    /**
    * The return types for parsing.
    *
    * @enum { number } ParseReturnType
    * @syscap SystemCapability.Utils.Lang
    * @atomicservice
    * @since 12
    */
    /**
     * The return types for parsing.
     *
     * @enum { number } ParseReturnType
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    const enum ParseReturnType {
      /**
      * Return type is object.
      *
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 12
      */
      /**
       * Return type is object.
       *
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      OBJECT = 0,
      /**
      * Return type is map.
      *
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 13
      */
      /**
      * Return type is map.
      *
      * @syscap SystemCapability.Utils.Lang
      * @crossplatform
      * @atomicservice
      * @since 18
      */
      MAP = 1,
    }
    /**
    * Parse's options
    *
    * @typedef ParseOptions
    * @syscap SystemCapability.Utils.Lang
    * @atomicservice
    * @since 12
    */
    /**
     * Parse's options
     *
     * @typedef ParseOptions
     * @syscap SystemCapability.Utils.Lang
     * @crossplatform
     * @atomicservice
     * @since 18
     */
    interface ParseOptions {
      /**
      * Enum defining modes for handling bigint.
      *
      * @type { BigIntMode }
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 12
      */
      /**
       * Enum defining modes for handling bigint.
       *
       * @type { BigIntMode }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      bigIntMode: BigIntMode;
      /**
      * The return types for parsing.
      *
      * @type { ParseReturnType }
      * @syscap SystemCapability.Utils.Lang
      * @atomicservice
      * @since 12
      */
      /**
       * The return types for parsing.
       *
       * @type { ParseReturnType }
       * @syscap SystemCapability.Utils.Lang
       * @crossplatform
       * @atomicservice
       * @since 18
       */
      parseReturnType: ParseReturnType;
    }
  }

  /**
  * Object used for store least recently used sendable Object.
  *
  * @syscap SystemCapability.Utils.Lang
  * @atomicservice
  * @since 18
  */
  @Sendable
  class SendableLruCache<K, V> {
    /**
     * The length of the SendableLruCache.
     *
     * @type { number }
     * @readonly
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    readonly length: number;
    /**
     * Default constructor.
     *
     * @param { number } capacity - The capacity of the SendableLruCache.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    constructor(capacity?: number);
    /**
     * Update the capacity of the SendableLruCache.
     *
     * @param { number } newCapacity - The new capacity of the SendableLruCache.
     * @throws { BusinessError } 401 - Parameter error. Possible causes:
     * 1.Mandatory parameters are left unspecified;
     * 2.Incorrect parameter types.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    updateCapacity(newCapacity: number): void;
    /**
     * Get the value associated with a specified key in the SendableLruCache.
     *
     * @param { K } key - The key to query.
     * @returns { V | undefined } The value associated with the key if the specified key is present;
     * returns undefined otherwise.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    get(key: K): V | undefined;
    /**
     * Adds a key-value pair to the SendableLruCache.
     *
     * @param { K } key - The key to add.
     * @param { V } value - The value associated with the key to add.
     * @returns { V } The value associated with the added key or the original value
     * if the key to add already exists.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    put(key: K, value: V): V;
    /**
     * Remove a specified key and its associated value from the SendableLruCache.
     *
     * @param { K } key - The key to delete.
     * @returns { V | undefined } The deleted value or undefined.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    remove(key: K): V | undefined;
    /**
     * Check whether the given key exists in the SendableLruCache. If exists, returns true; otherwise, returns false.
     *
     * @param { K } key - The key to check.
     * @returns { boolean } The result of the checked.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    contains(key: K): boolean;
    /**
     * Get the number of times createDefault in the SendableLruCache.
     *
     * @returns { number } The number of times createDefault.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    getCreateCount(): number;
    /**
     * Get the number of times that the queried values are not matched in the SendableLruCache.
     *
     * @returns { number } The number of times that the queried values are unmatched.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    getMissCount(): number;
    /**
     * Get the number of times that values are removed from the SendableLruCache.
     *
     * @returns { number } The number of times that values are removed.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    getRemoveCount(): number;
    /**
     * Get the number of times that the queried values are matched in the SendableLruCache.
     *
     * @returns { number } The number of times that the queried values are matched.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    getMatchCount(): number;
    /**
     * Get the number of times that values are added to SendableLruCache.
     *
     * @returns { number } The number of times that values are added.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    getPutCount(): number;
    /**
     * Get the Capacity of the SendableLruCache.
     *
     * @returns { number } The Capacity of the SendableLruCache.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    getCapacity(): number;
    /**
     * Clear all key-value pairs from the SendableLruCache.
     *
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    clear(): void;
    /**
     * Checks whether the SendableLruCache is empty.
     *
     * @returns { boolean } true if the SendableLruCache is empty, otherwise false.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    isEmpty(): boolean;
    /**
     * Returns a string which repesents all elements in SendableLruCache in the format "key: value".
     *
     * @returns { string } A new string contains all elements.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    toString(): string;
    /**
     * Returns a list of all values in the SendableLruCache.
     *
     * @returns { V[] } An array of all values.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    values(): V[];
    /**
     * Returns a list of all keys in the SendableLruCache.
     *
     * @returns { K[] } An array of all keys.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    keys(): K[];
    /**
     * Returns an iterable of key-value pairs for each element in the SendableLruCache.
     *
     * @returns { IterableIterator<[K, V]> } A new iterable iterator object.
     * @syscap SystemCapability.Utils.Lang
     * @atomicservice
     * @since 18
     */
    entries(): IterableIterator<[K, V]>;
  }

  /**
  * Checks whether an ArkTS value is sendable.
  * 
  * @param { Object | null | undefined } value - The value to check.
  * @returns { boolean } True if the value is sendable, false otherwise.
  * @syscap SystemCapability.Utils.Lang
  * @stagemodelonly
  * @atomicservice
  * @since 12
  */
  /**
   * Checks whether an ArkTS value is sendable.
   *
   * @param { Object | null | undefined } value - The value to check.
   * @returns { boolean } True if the value is sendable, false otherwise.
   * @syscap SystemCapability.Utils.Lang
   * @crossplatform
   * @stagemodelonly
   * @atomicservice
   * @since 18
   */
  function isSendable(value: Object | null | undefined): boolean;
}
export default utils;
