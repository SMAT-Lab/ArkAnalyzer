/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
#ifndef NAMESPACE_B
#define NAMESPACE_B
namespace SAME_NAMESPACE {
    struct BaseData {
        enum INDENT_TYPE { MAP, SEQ, NONE };
        int id;
        INDENT_TYPE type;

        BaseData(int id_, INDENT_TYPE type_) : id(id_), type(type_) {}
    };

    int GetId(const BaseData& data);

    BaseData::INDENT_TYPE GetType(const BaseData& data);
}
#endif