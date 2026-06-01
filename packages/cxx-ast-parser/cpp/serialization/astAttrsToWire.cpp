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

#include "serialization/astAttrsToWire.h"
#include "utils/ast_kind_const.h"

namespace ast_dumper {
namespace detail {

const llvm::json::Object *GetObject(const llvm::json::Object &o, llvm::StringRef key)
{
    const llvm::json::Value *v = o.get(key);
    return v ? v->getAsObject() : nullptr;
}

std::optional<std::string> GetString(const llvm::json::Object &o, llvm::StringRef key)
{
    if (const llvm::json::Value *v = o.get(key)) {
        if (auto s = v->getAsString()) {
            return s->str();
        }
    }
    return std::nullopt;
}

std::optional<bool> GetBool(const llvm::json::Object &o, llvm::StringRef key)
{
    if (const llvm::json::Value *v = o.get(key)) {
        if (auto b = v->getAsBoolean()) {
            return *b;
        }
    }
    return std::nullopt;
}

std::optional<int64_t> GetInt(const llvm::json::Object &o, llvm::StringRef key)
{
    if (const llvm::json::Value *v = o.get(key)) {
        if (auto n = v->getAsInteger()) {
            return *n;
        }
    }
    return std::nullopt;
}

std::optional<std::string> GetStringOrScalarString(const llvm::json::Object &o, llvm::StringRef key)
{
    if (const llvm::json::Value *v = o.get(key)) {
        if (auto s = v->getAsString()) {
            return s->str();
        }
        if (auto b = v->getAsBoolean()) {
            return *b ? "true" : "false";
        }
        if (auto n = v->getAsInteger()) {
            return std::to_string(*n);
        }
    }
    return std::nullopt;
}

std::optional<uint64_t> GetUint64FromJson(const llvm::json::Object &o, llvm::StringRef key)
{
    if (auto n = GetInt(o, key)) {
        return static_cast<uint64_t>(*n);
    }
    if (auto s = GetString(o, key)) {
        llvm::StringRef ref(*s);
        if (ref.consume_front("0x") || ref.consume_front("0X")) {
            uint64_t value = 0;
            if (!ref.getAsInteger(K_HEX_RADIX, value)) {
                return value;
            }
        }
    }
    return std::nullopt;
}

PositionOffset BuildPosition(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxPositionWire(fbb, static_cast<int32_t>(GetInt(*o, "line").value_or(0)),
                                              static_cast<int32_t>(GetInt(*o, "col").value_or(0)),
                                              static_cast<uint32_t>(GetInt(*o, "offset").value_or(0)),
                                              static_cast<uint32_t>(GetInt(*o, "tokLen").value_or(0)));
}

RangeOffset BuildRange(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    const llvm::json::Object *begin = GetObject(*o, "begin");
    const llvm::json::Object *end = GetObject(*o, "end");
    return ArkCxxAstFb::CreateCxxRangeWire(fbb, begin ? BuildPosition(fbb, begin) : 0,
                                           end ? BuildPosition(fbb, end) : 0);
}

TypeInfoOffset BuildTypeInfo(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxTypeInfoWire(fbb, pool.intern(GetString(*o, "qualType")),
                                              pool.intern(GetString(*o, "desugaredQualType")),
                                              GetUint64FromJson(*o, "typeAliasDeclId").value_or(0));
}

ReferencedDeclOffset BuildReferencedDecl(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
                                         const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxReferencedDeclWire(
        fbb, LookupAstKindId(GetString(*o, "kind").value_or("")), pool.intern(GetString(*o, "name")),
        BuildTypeInfo(pool, fbb, GetObject(*o, "type")));
}

AnyInitOffset BuildAnyInit(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxCtorAnyInitWire(fbb, pool.intern(GetString(*o, "name")),
                                                 BuildTypeInfo(pool, fbb, GetObject(*o, "type")));
}

IncludeInfoOffset BuildIncludeInfo(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxIncludeInfoWire(
        fbb, pool.intern(GetString(*o, "fileName")), pool.intern(GetString(*o, "includeName")),
        LookupAstKindId(GetString(*o, "kind").value_or("")), BuildPosition(fbb, GetObject(*o, "loc")));
}

LocOffset BuildLoc(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxLocWire(fbb, pool.intern(GetString(*o, "file")),
                                         static_cast<int32_t>(GetInt(*o, "line").value_or(0)),
                                         static_cast<int32_t>(GetInt(*o, "col").value_or(0)));
}

ClassBaseOffset BuildClassBase(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    uint8_t accessId = kAttrUnknown;
    if (const auto accessStr = GetString(*o, "access")) {
        accessId = LookupAccessId(*accessStr);
    }
    return ArkCxxAstFb::CreateClassBaseWire(fbb, accessId, BuildTypeInfo(pool, fbb, GetObject(*o, "type")),
                                            PackCxxBaseFlags(GetBool(*o, "isVirtual").value_or(false)));
}

IncludesVectorOffset BuildIncludesVector(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
                                         const llvm::json::Array *arr)
{
    if (!arr || arr->empty()) {
        return 0;
    }
    std::vector<IncludeInfoOffset> items;
    items.reserve(arr->size());
    for (const llvm::json::Value &v : *arr) {
        if (const llvm::json::Object *o = v.getAsObject()) {
            items.push_back(BuildIncludeInfo(pool, fbb, o));
        }
    }
    if (items.empty()) {
        return 0;
    }
    return fbb.CreateVector(items);
}

ClassBasesVectorOffset BuildBasesVector(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
                                        const llvm::json::Array *arr)
{
    if (!arr || arr->empty()) {
        return 0;
    }
    std::vector<ClassBaseOffset> items;
    items.reserve(arr->size());
    for (const llvm::json::Value &v : *arr) {
        if (const llvm::json::Object *o = v.getAsObject()) {
            items.push_back(BuildClassBase(pool, fbb, o));
        }
    }
    if (items.empty()) {
        return 0;
    }
    return fbb.CreateVector(items);
}

} // namespace detail

llvm::json::Object MaterializeAttrsForWire(const llvm::json::Object &attrs)
{
    const std::string serialized = JsonObjectToString(attrs);
    llvm::Expected<llvm::json::Value> parsed = llvm::json::parse(serialized);
    if (!parsed) {
        llvm::consumeError(parsed.takeError());
        return llvm::json::Object(attrs);
    }
    if (llvm::json::Object *obj = parsed->getAsObject()) {
        return std::move(*obj);
    }
    return llvm::json::Object(attrs);
}

namespace {
using namespace detail;

bool HasWireStrId(uint32_t id)
{
    return id != 0;
}

struct CxxAstNodeArrayOffsets {
    IncludesVectorOffset includesOff = 0;
    ClassBasesVectorOffset basesOff = 0;
};

CxxAstNodeArrayOffsets BuildCxxAstNodeArrayOffsets(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
    const llvm::json::Object &attrs)
{
    CxxAstNodeArrayOffsets offsets;
    if (const llvm::json::Value *arrVal = attrs.get("includes")) {
        if (const llvm::json::Array *arr = arrVal->getAsArray()) {
            offsets.includesOff = BuildIncludesVector(pool, fbb, arr);
        }
    }
    if (const llvm::json::Value *arrVal = attrs.get("bases")) {
        if (const llvm::json::Array *arr = arrVal->getAsArray()) {
            offsets.basesOff = BuildBasesVector(pool, fbb, arr);
        }
    }
    return offsets;
}

struct CxxAstNodeWireIdentityFields {
    uint32_t idStr = 0;
    uint32_t originalIdStr = 0;
    bool hasInClassInitializer = false;
    uint16_t kindId = kAstKindUnknown;
    uint32_t nameStr = 0;
    uint32_t modifierFlags = 0;
    bool hasModifierFlags = false;
    TypeInfoOffset typeOff = 0;
    uint32_t mangledNameStr = 0;
    uint8_t tagUsedId = kAttrUnknown;
    bool hasTagUsed = false;
    bool isImplicit = false;
    uint8_t storageClassId = kAttrUnknown;
    bool hasStorageClass = false;
    uint8_t accessId = kAttrUnknown;
    bool hasAccess = false;
    ReferencedDeclOffset referencedDeclOff = 0;
};

struct CxxAstNodeWireExprFields {
    uint32_t valueStr = 0;
    uint8_t valueCategoryId = kAttrUnknown;
    bool hasValueCategory = false;
    uint16_t castKindId = 0;
    bool hasCastKind = false;
    uint8_t opcodeId = kAttrUnknown;
    bool hasOpcode = false;
    uint8_t opId = kAttrUnknown;
    bool hasOp = false;
    bool isPostfix = false;
    bool isArrow = false;
    bool isArray = false;
    TypeInfoOffset typeArgOff = 0;
};

struct CxxAstNodeWireDeclFields {
    AnyInitOffset anyInitOff = 0;
    TypeInfoOffset baseInitOff = 0;
    uint32_t nominatedNamespaceStr = 0;
    LocOffset locOff = 0;
    RangeOffset rangeOff = 0;
    TypeInfoOffset defaultArgOff = 0;
    uint16_t dtorKindId = kAstKindUnknown;
};

CxxAstNodeWireIdentityFields CollectWireIdentityFields(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
                                                       const llvm::json::Object &attrs, uint32_t mangledNameStr)
{
    CxxAstNodeWireIdentityFields fields;
    fields.idStr = pool.intern(GetString(attrs, "id"));
    fields.originalIdStr = pool.intern(GetString(attrs, "originalId"));
    fields.hasInClassInitializer = GetBool(attrs, "hasInClassInitializer").value_or(false);
    fields.kindId = LookupAstKindId(GetString(attrs, "kind").value_or(""));
    fields.nameStr = pool.intern(GetString(attrs, "name"));
    if (const auto flags = GetUint64FromJson(attrs, "modifierFlags")) {
        fields.modifierFlags = static_cast<uint32_t>(*flags);
        fields.hasModifierFlags = fields.modifierFlags != 0;
    }
    fields.typeOff = BuildTypeInfo(pool, fbb, GetObject(attrs, "type"));
    fields.mangledNameStr = mangledNameStr;
    if (const auto tagUsedStr = GetString(attrs, "tagUsed")) {
        const uint8_t id = LookupTagUsedId(*tagUsedStr);
        if (id != kAttrUnknown) {
            fields.hasTagUsed = true;
            fields.tagUsedId = id;
        }
    }
    fields.isImplicit = GetBool(attrs, "isImplicit").value_or(false);
    if (const auto storageClassStr = GetString(attrs, "storageClass")) {
        const uint8_t id = LookupStorageClassId(*storageClassStr);
        if (id != kAttrUnknown) {
            fields.hasStorageClass = true;
            fields.storageClassId = id;
        }
    }
    if (const auto accessStr = GetString(attrs, "access")) {
        const uint8_t id = LookupAccessId(*accessStr);
        if (id != kAttrUnknown) {
            fields.hasAccess = true;
            fields.accessId = id;
        }
    }
    if (const llvm::json::Object *refObj = GetObject(attrs, "referencedDecl")) {
        fields.referencedDeclOff = BuildReferencedDecl(pool, fbb, refObj);
    }
    return fields;
}

CxxAstNodeWireExprFields CollectWireExprFields(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
                                               const llvm::json::Object &attrs)
{
    CxxAstNodeWireExprFields fields;
    fields.valueStr = pool.intern(GetStringOrScalarString(attrs, "value"));
    if (const auto valueCategoryStr = GetString(attrs, "valueCategory")) {
        const uint8_t id = LookupValueCategoryId(*valueCategoryStr);
        if (id != kAttrUnknown) {
            fields.hasValueCategory = true;
            fields.valueCategoryId = id;
        }
    }
    if (const auto castKindStr = GetString(attrs, "castKind")) {
        const uint16_t id = LookupAstKindId(*castKindStr);
        if (id != kAstKindUnknown) {
            fields.hasCastKind = true;
            fields.castKindId = id;
        }
    }
    if (const auto opcodeStr = GetString(attrs, "opcode")) {
        const uint8_t id = LookupOpcodeId(*opcodeStr);
        if (id != kAttrUnknown) {
            fields.hasOpcode = true;
            fields.opcodeId = id;
        }
    }
    if (const auto opStr = GetString(attrs, "op")) {
        const uint8_t id = LookupFoldOpId(*opStr);
        if (id != kAttrUnknown) {
            fields.hasOp = true;
            fields.opId = id;
        }
    }
    fields.isPostfix = GetBool(attrs, "isPostfix").value_or(false);
    fields.isArrow = GetBool(attrs, "isArrow").value_or(false);
    fields.isArray = GetBool(attrs, "isArray").value_or(false);
    if (const llvm::json::Object *typeArgObj = GetObject(attrs, "typeArg")) {
        fields.typeArgOff = BuildTypeInfo(pool, fbb, typeArgObj);
    }
    return fields;
}

CxxAstNodeWireDeclFields CollectWireDeclFields(WireStringPool &pool, flatbuffers::FlatBufferBuilder &fbb,
                                               const llvm::json::Object &attrs)
{
    CxxAstNodeWireDeclFields fields;
    if (const llvm::json::Object *anyInitObj = GetObject(attrs, "anyInit")) {
        fields.anyInitOff = BuildAnyInit(pool, fbb, anyInitObj);
    }
    if (const llvm::json::Object *baseInitObj = GetObject(attrs, "baseInit")) {
        fields.baseInitOff = BuildTypeInfo(pool, fbb, baseInitObj);
    }
    if (const llvm::json::Object *nsObj = GetObject(attrs, "nominatedNamespace")) {
        fields.nominatedNamespaceStr = pool.intern(GetString(*nsObj, "name"));
    }
    if (const llvm::json::Object *locObj = GetObject(attrs, "loc")) {
        fields.locOff = BuildLoc(pool, fbb, locObj);
    }
    if (const llvm::json::Object *rangeObj = GetObject(attrs, "range")) {
        fields.rangeOff = BuildRange(fbb, rangeObj);
    }
    if (const llvm::json::Object *defArgObj = GetObject(attrs, "defaultArg")) {
        fields.defaultArgOff = BuildTypeInfo(pool, fbb, GetObject(*defArgObj, "type"));
    }
    if (const llvm::json::Object *dtorObj = GetObject(attrs, "dtor")) {
        fields.dtorKindId = LookupAstKindId(GetString(*dtorObj, "kind").value_or(""));
    }
    return fields;
}

struct CxxAstNodeWireCollectedFields {
    CxxAstNodeWireIdentityFields identity;
    CxxAstNodeWireExprFields expr;
    CxxAstNodeWireDeclFields decl;
    CxxAstNodeArrayOffsets arrays;
    flatbuffers::Offset<flatbuffers::Vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>>> innerVec = 0;
    flatbuffers::Offset<flatbuffers::Vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>>> headerUnitsVec = 0;
};

template <typename T>
bool HasWireOffset(flatbuffers::Offset<T> off)
{
    return off.o != 0;
}

using WireNodeBuilder = ArkCxxAstFb::CxxAstNodeWireBuilder;

void AddWireContainerFields(WireNodeBuilder &builder, const CxxAstNodeWireCollectedFields &fields,
    const CxxAstNodeArrayOffsets &arrayOffsets)
{
    if (HasWireOffset(fields.headerUnitsVec)) {
        builder.add_header_units(fields.headerUnitsVec);
    }
    if (HasWireOffset(fields.innerVec)) {
        builder.add_inner(fields.innerVec);
    }
    if (HasWireOffset(arrayOffsets.basesOff)) {
        builder.add_bases(arrayOffsets.basesOff);
    }
    if (HasWireOffset(arrayOffsets.includesOff)) {
        builder.add_includes(arrayOffsets.includesOff);
    }
}

void AddWireDeclFields(WireNodeBuilder &builder, const CxxAstNodeWireDeclFields &decl)
{
    if (HasWireOffset(decl.defaultArgOff)) {
        builder.add_default_arg(decl.defaultArgOff);
    }
    if (HasWireOffset(decl.rangeOff)) {
        builder.add_range(decl.rangeOff);
    }
    if (HasWireOffset(decl.locOff)) {
        builder.add_loc(decl.locOff);
    }
    if (HasWireStrId(decl.nominatedNamespaceStr)) {
        builder.add_nominated_namespace(decl.nominatedNamespaceStr);
    }
    if (HasWireOffset(decl.baseInitOff)) {
        builder.add_base_init(decl.baseInitOff);
    }
    if (HasWireOffset(decl.anyInitOff)) {
        builder.add_any_init(decl.anyInitOff);
    }
    if (decl.dtorKindId != 0) {
        builder.add_dtor(decl.dtorKindId);
    }
}

void AddWireExprFields(WireNodeBuilder &builder, const CxxAstNodeWireExprFields &expr)
{
    if (HasWireOffset(expr.typeArgOff)) {
        builder.add_type_arg(expr.typeArgOff);
    }
    if (expr.hasOp) {
        builder.add_op(expr.opId);
    }
    if (expr.hasOpcode) {
        builder.add_opcode(expr.opcodeId);
    }
    if (expr.hasCastKind) {
        builder.add_cast_kind(expr.castKindId);
    }
    if (expr.hasValueCategory) {
        builder.add_value_category(expr.valueCategoryId);
    }
    if (HasWireStrId(expr.valueStr)) {
        builder.add_value(expr.valueStr);
    }
}

void AddWireIdentityFields(WireNodeBuilder &builder, const CxxAstNodeWireIdentityFields &identity,
    const CxxAstNodeWireExprFields &expr)
{
    if (HasWireOffset(identity.referencedDeclOff)) {
        builder.add_referenced_decl(identity.referencedDeclOff);
    }
    if (identity.hasAccess) {
        builder.add_access(identity.accessId);
    }
    if (identity.hasStorageClass) {
        builder.add_storage_class(identity.storageClassId);
    }
    if (identity.hasTagUsed) {
        builder.add_tag_used(identity.tagUsedId);
    }
    if (HasWireStrId(identity.mangledNameStr)) {
        builder.add_mangled_name(identity.mangledNameStr);
    }
    if (HasWireOffset(identity.typeOff)) {
        builder.add_type(identity.typeOff);
    }
    if (identity.hasModifierFlags) {
        builder.add_modifier_flags(identity.modifierFlags);
    }
    if (HasWireStrId(identity.nameStr)) {
        builder.add_name(identity.nameStr);
    }
    if (HasWireStrId(identity.originalIdStr)) {
        builder.add_original_id(identity.originalIdStr);
    }
    if (HasWireStrId(identity.idStr)) {
        builder.add_id(identity.idStr);
    }
    builder.add_kind(identity.kindId);
    const uint8_t nodeFlags = PackCxxNodeFlags(identity.hasInClassInitializer, identity.isImplicit, expr.isPostfix,
        expr.isArrow, expr.isArray);
    if (nodeFlags != 0) {
        builder.add_node_flags(nodeFlags);
    }
}

flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire> CreateCxxAstNodeWireFromAttrs(
    flatbuffers::FlatBufferBuilder &fbb, const CxxAstNodeWireCollectedFields &fields)
{
    WireNodeBuilder builder(fbb);
    AddWireContainerFields(builder, fields, fields.arrays);
    AddWireDeclFields(builder, fields.decl);
    AddWireExprFields(builder, fields.expr);
    AddWireIdentityFields(builder, fields.identity, fields.expr);
    return builder.Finish();
}

} // namespace

flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire> BuildCxxAstNodeWireFromJson(
    flatbuffers::FlatBufferBuilder &fbb, WireStringPool &pool, const llvm::json::Object &attrsIn,
    const std::vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>> &inner,
    const std::vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>> &headerUnits)
{
    const llvm::json::Object attrs = MaterializeAttrsForWire(attrsIn);
    CxxAstNodeWireCollectedFields fields;
    fields.identity =
        CollectWireIdentityFields(pool, fbb, attrs, pool.intern(GetString(attrs, "mangledName")));
    fields.expr = CollectWireExprFields(pool, fbb, attrs);
    fields.decl = CollectWireDeclFields(pool, fbb, attrs);
    fields.arrays = BuildCxxAstNodeArrayOffsets(pool, fbb, attrs);
    fields.innerVec = inner.empty() ? 0 : fbb.CreateVector(inner);
    fields.headerUnitsVec = headerUnits.empty() ? 0 : fbb.CreateVector(headerUnits);
    return CreateCxxAstNodeWireFromAttrs(fbb, fields);
}

} // namespace ast_dumper
