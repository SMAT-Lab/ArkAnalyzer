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
 * See the License for the applicable language governing permissions and
 * limitations under the License.
 */

#include "serialization/wire_string_pool.h"

namespace ast_dumper {

uint32_t WireStringPool::intern(llvm::StringRef text)
{
    if (text.empty()) {
        return 0;
    }
    const std::string key(text);
    const auto found = index_.find(key);
    if (found != index_.end()) {
        return found->second;
    }
    const uint32_t id = static_cast<uint32_t>(strings_.size()) + 1;
    strings_.push_back(key);
    index_.emplace(strings_.back(), id);
    return id;
}

uint32_t WireStringPool::intern(const std::optional<std::string> &text)
{
    if (!text || text->empty()) {
        return 0;
    }
    return intern(llvm::StringRef(*text));
}

flatbuffers::Offset<flatbuffers::Vector<flatbuffers::Offset<flatbuffers::String>>> WireStringPool::createVector(
    flatbuffers::FlatBufferBuilder &fbb) const
{
    if (strings_.empty()) {
        return 0;
    }
    std::vector<flatbuffers::Offset<flatbuffers::String>> items;
    items.reserve(strings_.size());
    for (const std::string &s : strings_) {
        items.push_back(fbb.CreateString(s));
    }
    return fbb.CreateVector(items);
}

} // namespace ast_dumper
