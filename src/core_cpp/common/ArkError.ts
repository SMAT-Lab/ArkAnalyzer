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

export enum ArkErrorCode {
    OK = 0,
    CLASS_INSTANCE_FIELD_UNDEFINDED = -1,
    BB_MORE_THAN_ONE_BRANCH_RET_STMT = -2,
    BB_BRANCH_RET_STMT_NOT_AT_END = -3,
    CFG_NOT_FOUND_START_BLOCK = -4,
    CFG_HAS_UNREACHABLE_BLOCK = -5,
    METHOD_SIGNATURE_UNDEFINED = -6,
    METHOD_SIGNATURE_LINE_UNMATCHED = -7,
}

export interface ArkError {
    errCode: ArkErrorCode;
    errMsg?: string;
}
