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

#include "flatGenerated/astWire_generated.h"
#include "serialization/astNodeAttrsExtract.h"
#include "serialization/wire_string_pool.h"
#include <flatbuffers/flatbuffers.h>
#include <llvm/ADT/StringRef.h>
#include <llvm/Support/JSON.h>

#include <optional>
#include <string>
#include <vector>

namespace ast_dumper {

namespace detail {

constexpr int K_HEX_RADIX = 16;

using PositionOffset = flatbuffers::Offset<ArkCxxAstFb::CxxPositionWire>;
using RangeOffset = flatbuffers::Offset<ArkCxxAstFb::CxxRangeWire>;
using TypeInfoOffset = flatbuffers::Offset<ArkCxxAstFb::CxxTypeInfoWire>;
using ReferencedDeclOffset = flatbuffers::Offset<ArkCxxAstFb::CxxReferencedDeclWire>;
using AnyInitOffset = flatbuffers::Offset<ArkCxxAstFb::CxxCtorAnyInitWire>;
using IncludeInfoOffset = flatbuffers::Offset<ArkCxxAstFb::CxxIncludeInfoWire>;
using LocOffset = flatbuffers::Offset<ArkCxxAstFb::CxxLocWire>;
using ClassBaseOffset = flatbuffers::Offset<ArkCxxAstFb::ClassBaseWire>;
using IncludesVectorOffset = flatbuffers::Offset<flatbuffers::Vector<IncludeInfoOffset>>;
using ClassBasesVectorOffset = flatbuffers::Offset<flatbuffers::Vector<ClassBaseOffset>>;

const llvm::json::Object *GetObject(const llvm::json::Object &o, llvm::StringRef key);
std::optional<std::string> GetString(const llvm::json::Object &o, llvm::StringRef key);
std::optional<std::string> GetStringOrScalarString(const llvm::json::Object &o, llvm::StringRef key);
std::optional<bool> GetBool(const llvm::json::Object &o, llvm::StringRef key);
std::optional<int64_t> GetInt(const llvm::json::Object &o, llvm::StringRef key);
std::optional<uint64_t> GetUint64FromJson(const llvm::json::Object &o, llvm::StringRef key);

PositionOffset BuildPosition(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o);
RangeOffset BuildRange(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o);
TypeInfoOffset BuildTypeInfo(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object *o);
ReferencedDeclOffset BuildReferencedDecl(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object *o);
AnyInitOffset BuildAnyInit(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object *o);
IncludeInfoOffset BuildIncludeInfo(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object *o);
LocOffset BuildLoc(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o);
ClassBaseOffset BuildClassBase(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object *o);
IncludesVectorOffset BuildIncludesVector(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Array *arr);
ClassBasesVectorOffset BuildBasesVector(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Array *arr);

} // namespace detail

llvm::json::Object MaterializeAttrsForWire(const llvm::json::Object &attrs);

flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire> BuildCxxAstNodeWireFromJson(
    flatbuffers::FlatBufferBuilder &fbb, WireStringPool &pool, const llvm::json::Object &attrsIn,
    const std::vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>> &inner,
    const std::vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>> &headerUnits);

} // namespace ast_dumper
