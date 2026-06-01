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

#pragma once

#include <flatbuffers/flatbuffers.h>
#include <llvm/ADT/StringRef.h>

#include <cstdint>
#include <optional>
#include <string>
#include <unordered_map>
#include <vector>

namespace ast_dumper {

/// Per-flat string table: id 0 = absent/empty; id N refers to strings_[N - 1].
class WireStringPool {
public:
    uint32_t intern(llvm::StringRef text);
    uint32_t intern(const std::optional<std::string> &text);

    flatbuffers::Offset<flatbuffers::Vector<flatbuffers::Offset<flatbuffers::String>>> createVector(
        flatbuffers::FlatBufferBuilder &fbb) const;

private:
    std::vector<std::string> strings_;
    std::unordered_map<std::string, uint32_t> index_;
};

} // namespace ast_dumper
