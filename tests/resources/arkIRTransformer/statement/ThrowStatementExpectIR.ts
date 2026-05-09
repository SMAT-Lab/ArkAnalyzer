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

export const THROW_STATIC_INVOKE_EXPECT_IR = `private static throwError(): void {
  label0:
    this = this: @statement/ThrowStatementTest.ts: ThrowTestClass
    %0 = staticinvoke <@statement/ThrowStatementTest.ts: ThrowTestClass.[static]createError()>()
    throw %0
    return
}
`;

export const THROW_NEW_EXPRESSION_EXPECT_IR = `private throwErrorInstance(): void {
  label0:
    this = this: @statement/ThrowStatementTest.ts: ThrowTestClass
    %0 = new @built-in/lib.es5.d.ts: Error
    %0 = instanceinvoke %0.<@built-in/lib.es5.d.ts: ErrorConstructor.construct-signature(string)>('instance error')
    throw %0
    return
}
`;

export const THROW_FIELD_REF_EXPECT_IR = `private throwComplexExpression(): void {
  label0:
    this = this: @statement/ThrowStatementTest.ts: ThrowTestClass
    %0 = staticinvoke <@statement/ThrowStatementTest.ts: ThrowTestClass.[static]createError()>()
    %1 = %0.<@built-in/lib.es5.d.ts: Error.message>
    throw %1
    return
}
`;

export const THROW_SIMPLE_VALUE_EXPECT_IR = `private throwSimpleValue(): void {
  label0:
    this = this: @statement/ThrowStatementTest.ts: ThrowTestClass
    throw 'simple error'
    return
}
`;

export const THROW_NESTED_CALL_EXPECT_IR = `private throwNestedCall(): void {
  label0:
    this = this: @statement/ThrowStatementTest.ts: ThrowTestClass
    %0 = staticinvoke <@statement/ThrowStatementTest.ts: ThrowTestClass.[static]nestedError()>()
    throw %0
    return
}
`;