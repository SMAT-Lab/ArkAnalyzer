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

// names
export const NAME_DELIMITER = '$';
export const NAME_PREFIX = '%';
export const UNKNOWN_NAME = 'unk';
export const DEFAULT_NAME = 'dflt';

// ArkClass const
export const DEFAULT_ARK_CLASS_NAME = NAME_PREFIX + DEFAULT_NAME;
export const ANONYMOUS_CLASS_PREFIX = NAME_PREFIX + 'AC';
export const ANONYMOUS_CLASS_DELIMITER = NAME_DELIMITER;

// ArkMethod const
export const DEFAULT_ARK_METHOD_NAME = NAME_PREFIX + DEFAULT_NAME;
export const INSTANCE_INIT_METHOD_NAME = NAME_PREFIX + 'instInit';
export const STATIC_INIT_METHOD_NAME = NAME_PREFIX + 'statInit';
export const STATIC_BLOCK_METHOD_NAME_PREFIX = NAME_PREFIX + 'statBlock';
export const ANONYMOUS_METHOD_PREFIX = NAME_PREFIX + 'AM';
export const CALL_SIGNATURE_NAME = 'create';

// ArkSignature const
export const UNKNOWN_PROJECT_NAME = NAME_PREFIX + UNKNOWN_NAME;
export const UNKNOWN_FILE_NAME = NAME_PREFIX + UNKNOWN_NAME;
export const UNKNOWN_NAMESPACE_NAME = NAME_PREFIX + UNKNOWN_NAME;
export const UNKNOWN_CLASS_NAME = ''; // temp for being compatible with existing type inference
export const UNKNOWN_FIELD_NAME = ''; // temp for being compatible with existing type inference
export const UNKNOWN_METHOD_NAME = ''; // temp for being compatible with existing type inference

// IR const
export const TEMP_LOCAL_PREFIX = NAME_PREFIX;
export const LEXICAL_ENV_NAME_PREFIX = TEMP_LOCAL_PREFIX + 'closures';

// ArkTS version
export const ARKTS_STATIC_MARK = 'use static';
