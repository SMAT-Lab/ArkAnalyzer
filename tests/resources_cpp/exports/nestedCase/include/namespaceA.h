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

#include "namespaceB.h"
#include <iostream>
#include <string>

using namespace std;

namespace SAME_NAMESPACE {
    class OuterClass {
    public:
        class InnerClass {
        private:
            int inner_id;
            string inner_name;
            BaseData inner_base;

        public:
            InnerClass(int id, const string& name, const BaseData& base)
                : inner_id(id), inner_name(name), inner_base(base) {}

            void PrintFullInfo() const
            {
                cout << "InnerClass [ID: " << inner_id << ", inner_name: " << inner_name << "] | " << GetId(inner_base) << endl;
            }
        };

        void ProcessInner(const InnerClass& inner_obj);
        void ProcessBase(const BaseData& base_obj);
    };
}