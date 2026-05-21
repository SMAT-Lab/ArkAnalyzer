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

StringOffset CreateOptString(flatbuffers::FlatBufferBuilder &fbb, const std::optional<std::string> &s)
{
    if (!s || s->empty()) {
        return 0;
    }
    return fbb.CreateString(*s);
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
            if (!ref.getAsInteger(kHexRadix, value)) {
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
    return ArkCxxAstFb::CreateCxxPositionWire(
        fbb, static_cast<int32_t>(GetInt(*o, "line").value_or(0)),
        static_cast<int32_t>(GetInt(*o, "col").value_or(0)),
        static_cast<uint32_t>(GetInt(*o, "offset").value_or(0)),
        static_cast<uint32_t>(GetInt(*o, "tokLen").value_or(0)), CreateOptString(fbb, GetString(*o, "file")));
}

RangeOffset BuildRange(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    const llvm::json::Object *begin = GetObject(*o, "begin");
    const llvm::json::Object *end = GetObject(*o, "end");
    return ArkCxxAstFb::CreateCxxRangeWire(
        fbb, begin ? BuildPosition(fbb, begin) : 0, end ? BuildPosition(fbb, end) : 0,
        BuildPosition(fbb, GetObject(*o, "spellingLoc")), BuildPosition(fbb, GetObject(*o, "expansionLoc")));
}

TypeInfoOffset BuildTypeInfo(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxTypeInfoWire(
        fbb, CreateOptString(fbb, GetString(*o, "type")), CreateOptString(fbb, GetString(*o, "qualType")),
        CreateOptString(fbb, GetString(*o, "desugaredQualType")),
        GetUint64FromJson(*o, "typeAliasDeclId").value_or(0),
        CreateOptString(fbb, GetString(*o, "typeAliasDeclQualifiedName")));
}

AliasInfoOffset BuildAliasInfo(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxAliasInfoWire(fbb, CreateOptString(fbb, GetString(*o, "declCode")),
                                               BuildRange(fbb, GetObject(*o, "range")));
}

ReferencedDeclOffset BuildReferencedDecl(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxReferencedDeclWire(
        fbb, CreateOptString(fbb, GetString(*o, "kind")), CreateOptString(fbb, GetString(*o, "name")),
        BuildTypeInfo(fbb, GetObject(*o, "type")), BuildAliasInfo(fbb, GetObject(*o, "alias")));
}

AnyInitOffset BuildAnyInit(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxCtorAnyInitWire(fbb, CreateOptString(fbb, GetString(*o, "kind")),
                                                 CreateOptString(fbb, GetString(*o, "name")),
                                                 BuildTypeInfo(fbb, GetObject(*o, "type")));
}

EnclosingFunctionOffset BuildEnclosingFunction(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxEnclosingFunctionWire(
        fbb, static_cast<uint64_t>(GetInt(*o, "id").value_or(0)), CreateOptString(fbb, GetString(*o, "kind")),
        CreateOptString(fbb, GetString(*o, "name")), BuildRange(fbb, GetObject(*o, "range")));
}

NominatedNamespaceOffset BuildNominatedNamespace(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxNominatedNamespaceWire(
        fbb, CreateOptString(fbb, GetString(*o, "id")), CreateOptString(fbb, GetString(*o, "kind")),
        CreateOptString(fbb, GetString(*o, "name")));
}

DtorTypeOffset BuildDtorType(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateDtorTypeWire(
        fbb, static_cast<uint64_t>(GetInt(*o, "id").value_or(0)), CreateOptString(fbb, GetString(*o, "kind")),
        CreateOptString(fbb, GetString(*o, "name")), BuildTypeInfo(fbb, GetObject(*o, "type")));
}

IncludeInfoOffset BuildIncludeInfo(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxIncludeInfoWire(
        fbb, CreateOptString(fbb, GetString(*o, "code")), CreateOptString(fbb, GetString(*o, "fileName")),
        CreateOptString(fbb, GetString(*o, "includeName")), CreateOptString(fbb, GetString(*o, "includedFrom")),
        GetBool(*o, "isAngled").value_or(false), CreateOptString(fbb, GetString(*o, "kind")),
        BuildPosition(fbb, GetObject(*o, "loc")), CreateOptString(fbb, GetString(*o, "relativePath")),
        CreateOptString(fbb, GetString(*o, "searchPath")));
}

LocOffset BuildLoc(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateCxxLocWire(
        fbb, CreateOptString(fbb, GetString(*o, "file")),
        static_cast<int32_t>(GetInt(*o, "line").value_or(0)), static_cast<int32_t>(GetInt(*o, "col").value_or(0)),
        static_cast<uint32_t>(GetInt(*o, "offset").value_or(0)),
        static_cast<uint32_t>(GetInt(*o, "tokLen").value_or(0)), BuildPosition(fbb, GetObject(*o, "spellingLoc")),
        BuildPosition(fbb, GetObject(*o, "expansionLoc")));
}

DefaultArgOffset BuildDefaultArg(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateDefaultArgWire(fbb, CreateOptString(fbb, GetString(*o, "kind")),
                                             BuildTypeInfo(fbb, GetObject(*o, "type")));
}

ClassBaseOffset BuildClassBase(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object *o)
{
    if (!o) {
        return 0;
    }
    return ArkCxxAstFb::CreateClassBaseWire(fbb, CreateOptString(fbb, GetString(*o, "access")),
                                           BuildTypeInfo(fbb, GetObject(*o, "type")),
                                           GetBool(*o, "isVirtual").value_or(false),
                                           CreateOptString(fbb, GetString(*o, "writtenAccess")));
}

StringVectorOffset BuildStringVector(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Array *arr)
{
    if (!arr || arr->empty()) {
        return 0;
    }
    std::vector<StringOffset> strings;
    strings.reserve(arr->size());
    for (const llvm::json::Value &v : *arr) {
        if (auto s = v.getAsString()) {
            strings.push_back(fbb.CreateString(s->str()));
        }
    }
    if (strings.empty()) {
        return 0;
    }
    return fbb.CreateVector(strings);
}

IncludesVectorOffset BuildIncludesVector(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Array *arr)
{
    if (!arr || arr->empty()) {
        return 0;
    }
    std::vector<IncludeInfoOffset> items;
    items.reserve(arr->size());
    for (const llvm::json::Value &v : *arr) {
        if (const llvm::json::Object *o = v.getAsObject()) {
            items.push_back(BuildIncludeInfo(fbb, o));
        }
    }
    if (items.empty()) {
        return 0;
    }
    return fbb.CreateVector(items);
}

ClassBasesVectorOffset BuildBasesVector(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Array *arr)
{
    if (!arr || arr->empty()) {
        return 0;
    }
    std::vector<ClassBaseOffset> items;
    items.reserve(arr->size());
    for (const llvm::json::Value &v : *arr) {
        if (const llvm::json::Object *o = v.getAsObject()) {
            items.push_back(BuildClassBase(fbb, o));
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

struct CxxAstNodeArrayOffsets {
    StringVectorOffset arraySizesOff = 0;
    StringVectorOffset typeArgumentsOff = 0;
    IncludesVectorOffset includesOff = 0;
    ClassBasesVectorOffset basesOff = 0;
};

template <typename BuildFn, typename Slot>
void AssignJsonArrayField(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object &attrs,
                          llvm::StringRef key, BuildFn build, Slot &slot)
{
    if (const llvm::json::Value *arrVal = attrs.get(key)) {
        if (const llvm::json::Array *arr = arrVal->getAsArray()) {
            slot = build(fbb, arr);
        }
    }
}

CxxAstNodeArrayOffsets BuildCxxAstNodeArrayOffsets(flatbuffers::FlatBufferBuilder &fbb,
                                                   const llvm::json::Object &attrs)
{
    CxxAstNodeArrayOffsets offsets;
    AssignJsonArrayField(fbb, attrs, "arraySizes", BuildStringVector, offsets.arraySizesOff);
    AssignJsonArrayField(fbb, attrs, "typeArguments", BuildStringVector, offsets.typeArgumentsOff);
    AssignJsonArrayField(fbb, attrs, "includes", BuildIncludesVector, offsets.includesOff);
    AssignJsonArrayField(fbb, attrs, "bases", BuildBasesVector, offsets.basesOff);
    return offsets;
}

struct CxxAstNodeWireIdentityFields {
    StringOffset idOff = 0;
    StringOffset originalIdOff = 0;
    bool hasInClassInitializer = false;
    StringOffset kindOff = 0;
    StringOffset nameOff = 0;
    StringOffset codeOff = 0;
    TypeInfoOffset typeOff = 0;
    StringOffset mangledNameOff = 0;
    StringOffset tagUsedOff = 0;
    bool isImplicit = false;
    StringOffset storageClassOff = 0;
    StringOffset accessOff = 0;
    ReferencedDeclOffset referencedDeclOff = 0;
};

struct CxxAstNodeWireExprFields {
    StringOffset valueOff = 0;
    StringOffset valueCategoryOff = 0;
    StringOffset castKindOff = 0;
    StringOffset opcodeOff = 0;
    StringOffset opOff = 0;
    bool isPostfix = false;
    bool isArrow = false;
    bool isArray = false;
    StringOffset traitFuncOff = 0;
    StringOffset traitArgsOff = 0;
    StringOffset noexceptArgOff = 0;
    TypeInfoOffset typeArgOff = 0;
    StringOffset atomicFuncOff = 0;
    StringOffset pseudoDestructorTypeOff = 0;
    int32_t targetLabelId = 0;
};

struct CxxAstNodeWireDeclFields {
    AnyInitOffset anyInitOff = 0;
    TypeInfoOffset baseInitOff = 0;
    NominatedNamespaceOffset nominatedNamespaceOff = 0;
    LocOffset locOff = 0;
    RangeOffset rangeOff = 0;
    EnclosingFunctionOffset enclosingFunctionOff = 0;
    DefaultArgOffset defaultArgOff = 0;
    DtorTypeOffset dtorOff = 0;
    StringOffset defaultOff = 0;
};

CxxAstNodeWireIdentityFields CollectWireIdentityFields(flatbuffers::FlatBufferBuilder &fbb,
                                                       const llvm::json::Object &attrs,
                                                       StringOffset mangledNameOff)
{
    CxxAstNodeWireIdentityFields fields;
    fields.idOff = CreateOptString(fbb, GetString(attrs, "id"));
    fields.originalIdOff = CreateOptString(fbb, GetString(attrs, "originalId"));
    fields.hasInClassInitializer = GetBool(attrs, "hasInClassInitializer").value_or(false);
    fields.kindOff = CreateOptString(fbb, GetString(attrs, "kind"));
    fields.nameOff = CreateOptString(fbb, GetString(attrs, "name"));
    fields.codeOff = CreateOptString(fbb, GetString(attrs, "code"));
    fields.typeOff = BuildTypeInfo(fbb, GetObject(attrs, "type"));
    fields.mangledNameOff = mangledNameOff;
    fields.tagUsedOff = CreateOptString(fbb, GetString(attrs, "tagUsed"));
    fields.isImplicit = GetBool(attrs, "isImplicit").value_or(false);
    fields.storageClassOff = CreateOptString(fbb, GetString(attrs, "storageClass"));
    fields.accessOff = CreateOptString(fbb, GetString(attrs, "access"));
    if (const llvm::json::Object *refObj = GetObject(attrs, "referencedDecl")) {
        fields.referencedDeclOff = BuildReferencedDecl(fbb, refObj);
    }
    return fields;
}

CxxAstNodeWireExprFields CollectWireExprFields(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object &attrs)
{
    CxxAstNodeWireExprFields fields;
    fields.valueOff = CreateOptString(fbb, GetStringOrScalarString(attrs, "value"));
    fields.valueCategoryOff = CreateOptString(fbb, GetString(attrs, "valueCategory"));
    fields.castKindOff = CreateOptString(fbb, GetString(attrs, "castKind"));
    fields.opcodeOff = CreateOptString(fbb, GetString(attrs, "opcode"));
    fields.opOff = CreateOptString(fbb, GetString(attrs, "op"));
    fields.isPostfix = GetBool(attrs, "isPostfix").value_or(false);
    fields.isArrow = GetBool(attrs, "isArrow").value_or(false);
    fields.isArray = GetBool(attrs, "isArray").value_or(false);
    fields.traitFuncOff = CreateOptString(fbb, GetString(attrs, "traitFunc"));
    fields.traitArgsOff = CreateOptString(fbb, GetString(attrs, "traitArgs"));
    fields.noexceptArgOff = CreateOptString(fbb, GetString(attrs, "noexceptArg"));
    if (const llvm::json::Object *typeArgObj = GetObject(attrs, "typeArg")) {
        fields.typeArgOff = BuildTypeInfo(fbb, typeArgObj);
    }
    fields.atomicFuncOff = CreateOptString(fbb, GetString(attrs, "atomicFunc"));
    fields.pseudoDestructorTypeOff = CreateOptString(fbb, GetString(attrs, "pseudoDestructorType"));
    fields.targetLabelId = static_cast<int32_t>(GetInt(attrs, "targetLabelId").value_or(0));
    return fields;
}

void CollectWireDeclInitFields(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object &attrs,
                               CxxAstNodeWireDeclFields &fields)
{
    if (const llvm::json::Object *anyInitObj = GetObject(attrs, "anyInit")) {
        fields.anyInitOff = BuildAnyInit(fbb, anyInitObj);
    }
    if (const llvm::json::Object *baseInitObj = GetObject(attrs, "baseInit")) {
        fields.baseInitOff = BuildTypeInfo(fbb, baseInitObj);
    }
    if (const llvm::json::Object *nsObj = GetObject(attrs, "nominatedNamespace")) {
        fields.nominatedNamespaceOff = BuildNominatedNamespace(fbb, nsObj);
    }
}

void CollectWireDeclContextFields(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object &attrs,
                                  CxxAstNodeWireDeclFields &fields)
{
    if (const llvm::json::Object *locObj = GetObject(attrs, "loc")) {
        fields.locOff = BuildLoc(fbb, locObj);
    }
    if (const llvm::json::Object *rangeObj = GetObject(attrs, "range")) {
        fields.rangeOff = BuildRange(fbb, rangeObj);
    }
    if (const llvm::json::Object *encObj = GetObject(attrs, "enclosingFunction")) {
        fields.enclosingFunctionOff = BuildEnclosingFunction(fbb, encObj);
    }
    if (const llvm::json::Object *defArgObj = GetObject(attrs, "defaultArg")) {
        fields.defaultArgOff = BuildDefaultArg(fbb, defArgObj);
    }
    if (const llvm::json::Object *dtorObj = GetObject(attrs, "dtor")) {
        fields.dtorOff = BuildDtorType(fbb, dtorObj);
    }
}

CxxAstNodeWireDeclFields CollectWireDeclFields(flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object &attrs)
{
    CxxAstNodeWireDeclFields fields;
    CollectWireDeclInitFields(fbb, attrs, fields);
    CollectWireDeclContextFields(fbb, attrs, fields);
    fields.defaultOff = CreateOptString(fbb, GetString(attrs, "default"));
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

flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire> CreateCxxAstNodeWireFromAttrs(
    flatbuffers::FlatBufferBuilder &fbb, const CxxAstNodeWireCollectedFields &fields)
{
    const CxxAstNodeWireIdentityFields &identity = fields.identity;
    const CxxAstNodeWireExprFields &expr = fields.expr;
    const CxxAstNodeWireDeclFields &decl = fields.decl;
    const CxxAstNodeArrayOffsets &arrayOffsets = fields.arrays;
    return ArkCxxAstFb::CreateCxxAstNodeWire(
        fbb, identity.idOff, identity.originalIdOff, identity.hasInClassInitializer, identity.kindOff,
        identity.nameOff, identity.codeOff, identity.typeOff, identity.mangledNameOff, identity.tagUsedOff,
        identity.isImplicit, identity.storageClassOff, identity.accessOff, identity.referencedDeclOff, expr.valueOff,
        expr.valueCategoryOff, expr.castKindOff, expr.opcodeOff, expr.opOff, expr.isPostfix, expr.isArrow,
        expr.isArray, expr.traitFuncOff, expr.traitArgsOff, expr.noexceptArgOff, expr.typeArgOff, expr.atomicFuncOff,
        expr.pseudoDestructorTypeOff, expr.targetLabelId, decl.anyInitOff, decl.baseInitOff,
        decl.nominatedNamespaceOff, decl.locOff, decl.rangeOff, decl.enclosingFunctionOff, decl.defaultArgOff,
        decl.dtorOff, decl.defaultOff, arrayOffsets.arraySizesOff, arrayOffsets.typeArgumentsOff,
        arrayOffsets.includesOff, arrayOffsets.basesOff, fields.innerVec, fields.headerUnitsVec);
}

} // namespace

flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire> BuildCxxAstNodeWireFromJson(
    flatbuffers::FlatBufferBuilder &fbb, const llvm::json::Object &attrsIn,
    const std::vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>> &inner,
    const std::vector<flatbuffers::Offset<ArkCxxAstFb::CxxAstNodeWire>> &headerUnits)
{
    const llvm::json::Object attrs = MaterializeAttrsForWire(attrsIn);
    CxxAstNodeWireCollectedFields fields;
    fields.identity = CollectWireIdentityFields(fbb, attrs, CreateOptString(fbb, GetString(attrs, "mangledName")));
    fields.expr = CollectWireExprFields(fbb, attrs);
    fields.decl = CollectWireDeclFields(fbb, attrs);
    fields.arrays = BuildCxxAstNodeArrayOffsets(fbb, attrs);
    fields.innerVec = inner.empty() ? 0 : fbb.CreateVector(inner);
    fields.headerUnitsVec = headerUnits.empty() ? 0 : fbb.CreateVector(headerUnits);
    return CreateCxxAstNodeWireFromAttrs(fbb, fields);
}

} // namespace ast_dumper
