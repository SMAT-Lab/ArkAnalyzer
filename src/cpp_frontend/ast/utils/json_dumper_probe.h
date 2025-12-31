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
#pragma once

#include "llvm/Support/raw_ostream.h"

#include <cstddef>
#include <cstdint>
#include <cstring>

namespace ast_dumper {

// JsonDumperProbeStream:
// - Pass-through: forwards JSONNodeDumper output to an underlying raw_ostream.
// - Probes whether specific JSON keys ("name"/"code") appear in the dumper output.
// - Used to decide whether to synthesize missing fields while streaming.
class JsonDumperProbeStream final : public llvm::raw_ostream {
public:
    explicit JsonDumperProbeStream(llvm::raw_ostream &Out) : Out(Out) {}

    bool hasNameKey() const { return HasName; }
    bool hasCodeKey() const { return HasCode; }
    uint64_t bytesWritten() const { return Bytes; }

private:
    llvm::raw_ostream &Out;
    std::string buffer;
    uint64_t Bytes = 0;
    bool HasName = false;
    bool HasCode = false;

    // "\"name\"" and "\"code\"" are both length 6.
    static constexpr size_t kPatLen = 6;
    static constexpr size_t kTailMax = kPatLen - 1;

    char Tail[kTailMax] = {0};
    size_t TailLen = 0;

    static bool findPatternFixed6(const char *Data, size_t Len, const char *Pat6)
    {
        if (Len < kPatLen) {
            return false;
        }
        for (size_t i = 0; i + kPatLen <= Len; ++i) {
            if (std::memcmp(Data + i, Pat6, kPatLen) == 0) {
                return true;
            }
        }
        return false;
    }

    void scanKeys(const char *Ptr, size_t Size)
    {
        if (HasName && HasCode) return;

        const char *kName = "\"name\"";
        const char *kCode = "\"code\"";

        // boundary: tail + prefix
        if (TailLen > 0 && Size > 0) {
            char buf[kTailMax + (kPatLen - 1)];
            const size_t take = (Size < (kPatLen - 1)) ? Size : (kPatLen - 1);
            const size_t total = TailLen + take;

            std::memcpy(buf, Tail, TailLen);
            std::memcpy(buf + TailLen, Ptr, take);

            if (!HasName && findPatternFixed6(buf, total, kName)) {
                HasName = true;
            }
            if (!HasCode && findPatternFixed6(buf, total, kCode)) {
                HasCode = true;
            }
        }

        // chunk
        if (!HasName && findPatternFixed6(Ptr, Size, kName)) {
            HasName = true;
        }
        if (!HasCode && findPatternFixed6(Ptr, Size, kCode)) {
            HasCode = true;
        }

        // update tail
        if (Size >= kTailMax) {
            std::memcpy(Tail, Ptr + (Size - kTailMax), kTailMax);
            TailLen = kTailMax;
        } else {
            char tmp[kTailMax + kTailMax];
            size_t tmpLen = 0;

            if (TailLen > 0) {
                std::memcpy(tmp, Tail, TailLen);
                tmpLen += TailLen;
            }
            if (Size > 0) {
                std::memcpy(tmp + tmpLen, Ptr, Size);
                tmpLen += Size;
            }

            if (tmpLen > kTailMax) {
                const size_t start = tmpLen - kTailMax;
                std::memcpy(Tail, tmp + start, kTailMax);
                TailLen = kTailMax;
            } else {
                std::memcpy(Tail, tmp, tmpLen);
                TailLen = tmpLen;
            }
        }
    }

    void decodeNodeMangledName(const std::string &demangleStr, llvm::json::Object *obj)
    {
        std::string mangledName = "";
        size_t colonPos = demangleStr.find("::");
        if (colonPos != std::string::npos) {
            // Search for the starting position of the class name from the current position forward
            for (size_t i = colonPos - 1; i > 0; --i) {
                if (demangleStr[i] == ' ') {
                    mangledName = demangleStr.substr(i + 1, colonPos - i - 1);
                    break;
                }
            }
            // If no space is found, it indicates that the class name starts from the beginning of the string
            if (mangledName.empty() && colonPos > 0) {
                mangledName = demangleStr.substr(0, colonPos);
            }
        }
        (*obj)["mangledName"] = mangledName;
    }

    std::string decodeUtf8Octal(const std::string &input)
    {
        std::string output;
        output.reserve(input.size());
        for (size_t i = 0; i < input.size();) {
            if (input[i] == '\\' && i + 3 < input.size() && input[i + 1] >= '0' && input[i + 1] <= '7' &&
                input[i + 2] >= '0' && input[i + 2] <= '7' && input[i + 3] >= '0' && input[i + 3] <= '7') {
                unsigned char byte = (input[i + 1] - '0') * 64 + (input[i + 2] - '0') * 8 + (input[i + 3] - '0');
                output.push_back(static_cast<char>(byte));
                i += 4; // utf-8编码的八进制表示长度为3
            } else {
                output.push_back(input[i]);
                ++i;
            }
        }
        return output;
    }

    void updateNodeField(const char *Ptr, size_t Size)
    {
        buffer.append(Ptr, Size);
        auto nodeJson = llvm::json::parse("{" + buffer + "}");
        if (nodeJson) {
            if (auto *obj = nodeJson->getAsObject()) {
                if (auto mangleStr = (*obj)["mangledName"].getAsString()) {
                    decodeNodeMangledName(llvm::demangle(mangleStr.value().str()), obj);
                } else {
                    obj->erase("mangledName");
                }
                if (auto valueStr = (*obj)["value"].getAsString()) {
                    (*obj)["value"] = decodeUtf8Octal(valueStr.value().str());
                }
                llvm::json::Value jsonValue(std::move(*obj));
                std::string valueStr = llvm::formatv("{0}", jsonValue).str();
                buffer = valueStr.substr(1, valueStr.size() - 2);
            }
        }
    }

    void write_impl(const char *Ptr, size_t Size) override
    {
        if (Size == 0) return;
        scanKeys(Ptr, Size);
        updateNodeField(Ptr, Size);
        Out << buffer;
        buffer.clear();
        Bytes += Size;
    }

    uint64_t current_pos() const override
    {
        return Bytes;
    }
};

} // namespace ast_dumper
