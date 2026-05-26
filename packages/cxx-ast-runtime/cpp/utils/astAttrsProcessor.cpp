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

#include "utils/astAttrsProcessor.h"

namespace ast_dumper {
namespace attrs_processor_detail {

std::string DecodeNodeMangledName(const std::string &demangle)
{
    std::string demangleStr = llvm::demangle(demangle);
    std::string mangledName;
    size_t bracketPos = demangleStr.find("(");
    if (bracketPos != std::string::npos && bracketPos != 0) {
        size_t colonIndex = 0;
        for (size_t i = bracketPos - 1; i > 0; --i) {
            if (colonIndex == 0 && demangleStr[i] == ':') {
                colonIndex = i;
            }
            if (colonIndex != 0 && i + kOne < colonIndex &&
                (demangleStr[i] == ' ' || demangleStr[i] == ':')) {
                mangledName = demangleStr.substr(i + kOne, colonIndex - i - kTwo);
                break;
            }
        }
        if (mangledName.empty() && colonIndex > 0) {
            mangledName = demangleStr.substr(0, colonIndex - kOne);
        }
    }
    return mangledName;
}

std::string DecodeUtfOctal(const std::string &input)
{
    std::string decoded;
    decoded.reserve(input.size());
    for (size_t i = 0; i < input.size();) {
        if (IsUtfOctalEscape(input, i)) {
            decoded.push_back(static_cast<char>(DecodeUtfOctalByte(input, i)));
            i += kOctalSize;
        } else {
            decoded.push_back(input[i]);
            ++i;
        }
    }
    return decoded;
}

} // namespace attrs_processor_detail

void ApplyAttrFieldTransforms(llvm::json::Object &obj)
{
    std::string mangledName;
    if (auto mangleStr = obj.getString("mangledName")) {
        mangledName = attrs_processor_detail::DecodeNodeMangledName(mangleStr.value().str());
    }
    if (!mangledName.empty() && mangledName != "std") {
        obj["mangledName"] = mangledName;
    } else {
        obj.erase("mangledName");
    }
    if (auto valueStr = obj.getString("value")) {
        obj["value"] = attrs_processor_detail::DecodeUtfOctal(valueStr.value().str());
    }
}

bool AstAttrsProcessor::FindPatternFixed6(const char *data, size_t len, const char *pat6)
{
    if (len < kPatLen) {
        return false;
    }
    for (size_t i = 0; i + kPatLen <= len; ++i) {
        if (std::memcmp(data + i, pat6, kPatLen) == 0) {
            return true;
        }
    }
    return false;
}

void AstAttrsProcessor::MarkKeyIfFound(const char *data, size_t len, const char *pat6, bool &flag)
{
    if (!flag && FindPatternFixed6(data, len, pat6)) {
        flag = true;
    }
}

void AstAttrsProcessor::ScanBoundaryKeys(const char *ptr, size_t size, const char *kName, const char *kCode)
{
    if (tailLen == 0 || size == 0) {
        return;
    }
    char buf[kTailMax + (kPatLen - 1)];
    const size_t take = (size < (kPatLen - 1)) ? size : (kPatLen - 1);
    const size_t total = tailLen + take;
    attrs_processor_detail::CopyBytes(buf, tail, tailLen);
    attrs_processor_detail::CopyBytes(buf + tailLen, ptr, take);
    MarkKeyIfFound(buf, total, kName, hasName);
    MarkKeyIfFound(buf, total, kCode, hasCode);
}

void AstAttrsProcessor::UpdateTailBuffer(const char *ptr, size_t size)
{
    if (size >= kTailMax) {
        attrs_processor_detail::CopyBytes(tail, ptr + (size - kTailMax), kTailMax);
        tailLen = kTailMax;
        return;
    }
    char tmp[kTailMax + kTailMax];
    size_t tmpLen = 0;
    if (tailLen > 0) {
        attrs_processor_detail::CopyBytes(tmp, tail, tailLen);
        tmpLen += tailLen;
    }
    if (size > 0) {
        attrs_processor_detail::CopyBytes(tmp + tmpLen, ptr, size);
        tmpLen += size;
    }
    if (tmpLen > kTailMax) {
        const size_t start = tmpLen - kTailMax;
        attrs_processor_detail::CopyBytes(tail, tmp + start, kTailMax);
        tailLen = kTailMax;
    } else {
        attrs_processor_detail::CopyBytes(tail, tmp, tmpLen);
        tailLen = tmpLen;
    }
}

void AstAttrsProcessor::ScanKeys(const char *ptr, size_t size)
{
    if (hasName && hasCode) {
        return;
    }
    const char *kName = "\"name\"";
    const char *kCode = "\"code\"";
    ScanBoundaryKeys(ptr, size, kName, kCode);
    MarkKeyIfFound(ptr, size, kName, hasName);
    MarkKeyIfFound(ptr, size, kCode, hasCode);
    UpdateTailBuffer(ptr, size);
}

void AstAttrsProcessor::UpdateNodeField(const char *ptr, size_t size)
{
    buffer.append(ptr, size);
    auto nodeJson = llvm::json::parse("{" + buffer + "}");
    if (nodeJson) {
        if (auto *obj = nodeJson->getAsObject()) {
            ApplyAttrFieldTransforms(*obj);
            llvm::json::Value jsonValue(std::move(*obj));
            std::string valueStr = llvm::formatv("{0}", jsonValue).str();
            buffer = valueStr.substr(1, valueStr.size() - attrs_processor_detail::kTwo);
        }
    }
}

void AstAttrsProcessor::write_impl(const char *Ptr, size_t Size)
{
    if (Size == 0) {
        return;
    }
    ScanKeys(Ptr, Size);
    if (incrementalTransform) {
        UpdateNodeField(Ptr, Size);
        if (!deferOutputToFlush) {
            out << buffer;
            buffer.clear();
        }
    } else {
        out.write(Ptr, Size);
    }
    bytes += Size;
}

uint64_t AstAttrsProcessor::current_pos() const
{
    return bytes;
}

} // namespace ast_dumper
