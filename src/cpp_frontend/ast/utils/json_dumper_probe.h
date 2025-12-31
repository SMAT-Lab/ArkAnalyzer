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

#define OCTAL_MIN '0'
#define OCTAL_MAX '7'
#define OCTAL_size 4
#define BYTE64 64
#define BYTE8 8
#define ONE 1
#define TWO 2
#define THREE 3


namespace ast_dumper {

// JsonDumperProbeStream:
// - Pass-through: forwards JSONNodeDumper output to an underlying raw_ostream.
// - Probes whether specific JSON keys ("name"/"code") appear in the dumper output.
// - Used to decide whether to synthesize missing fields while streaming.
class JsonDumperProbeStream final : public llvm::raw_ostream {
public:
    explicit JsonDumperProbeStream(llvm::raw_ostream &out) : out(out) {}

    bool HasNameKey() const { return hasName; }
    bool HasCodeKey() const { return hasCode; }
    uint64_t BytesWritten() const { return bytes; }

private:
    llvm::raw_ostream &out;
    std::string buffer;
    uint64_t bytes = 0;
    bool hasName = false;
    bool hasCode = false;

    // "\"name\"" and "\"code\"" are both length 6.
    static constexpr size_t kPatLen = 6;
    static constexpr size_t kTailMax = kPatLen - 1;

    char tail[kTailMax] = {0};
    size_t tailLen = 0;

    static bool findPatternFixed6(const char *data, size_t len, const char *pat6)
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

    void scanKeys(const char *Ptr, size_t Size)
    {
        if (hasName && hasCode) {
            return;
        }

        const char *kName = "\"name\"";
        const char *kCode = "\"code\"";

        // boundary: tail + prefix
        if (tailLen > 0 && Size > 0) {
            char buf[kTailMax + (kPatLen - 1)];
            const size_t take = (Size < (kPatLen - 1)) ? Size : (kPatLen - 1);
            const size_t total = tailLen + take;

            memcpy_s(buf, sizeof(buf), tail, tailLen);
            memcpy_s(buf + tailLen, sizeof(buf) - tailLen, Ptr, take);

            if (!hasName && findPatternFixed6(buf, total, kName)) {
                hasName = true;
            }
            if (!hasCode && findPatternFixed6(buf, total, kCode)) {
                hasCode = true;
            }
        }

        // chunk
        if (!hasName && findPatternFixed6(Ptr, Size, kName)) {
            hasName = true;
        }
        if (!hasCode && findPatternFixed6(Ptr, Size, kCode)) {
            hasCode = true;
        }

        // update tail
        if (Size >= kTailMax) {
            memcpy_s(tail, sizeof(tail), Ptr + (Size - kTailMax), kTailMax);
            tailLen = kTailMax;
        } else {
            char tmp[kTailMax + kTailMax];
            size_t tmpLen = 0;

            if (tailLen > 0) {
                memcpy_s(tmp, sizeof(tmp), tail, tailLen);
                tmpLen += tailLen;
            }
            if (Size > 0) {
                memcpy_s(tmp + tmpLen, sizeof(tmp) - tmpLen, Ptr, Size);
                tmpLen += Size;
            }

            if (tmpLen > kTailMax) {
                const size_t start = tmpLen - kTailMax;
                memcpy_s(tail, sizeof(tail), tmp + start, kTailMax);
                tailLen = kTailMax;
            } else {
                memcpy_s(tail, sizeof(tail), tmp, tmpLen);
                tailLen = tmpLen;
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

    std::string decodeUtfOctal(const std::string &input)
    {
        std::string output;
        output.reserve(input.size());
        for (size_t i = 0; i < input.size();) {
            if (input[i] == '\\' && i + THREE < input.size() &&
                input[i + ONE] >= OCTAL_MIN && input[i + ONE] <= OCTAL_MAX &&
                input[i + TWO] >= OCTAL_MIN && input[i + TWO] <= OCTAL_MAX &&
                input[i + THREE] >= OCTAL_MIN && input[i + THREE] <= OCTAL_MAX) {
                unsigned char byte = (input[i + ONE] - OCTAL_MIN) * BYTE64 +
                                     (input[i + TWO] - OCTAL_MIN) * BYTE8 +
                                     (input[i + THREE] - OCTAL_MIN);
                output.push_back(static_cast<char>(byte));
                i += OCTAL_size; // utf-8编码的八进制表示长度为3
            } else {
                output.push_back(input[i]);
                ++i;
            }
        }
        return output;
    }

    void updateNodeField(const char *ptr, size_t size)
    {
        buffer.append(ptr, size);
        auto nodeJson = llvm::json::parse("{" + buffer + "}");
        if (nodeJson) {
            if (auto *obj = nodeJson->getAsObject()) {
                if (auto mangleStr = (*obj)["mangledName"].getAsString()) {
                    decodeNodeMangledName(llvm::demangle(mangleStr.value().str()), obj);
                } else {
                    obj->erase("mangledName");
                }
                if (auto valueStr = (*obj)["value"].getAsString()) {
                    (*obj)["value"] = decodeUtfOctal(valueStr.value().str());
                }
                llvm::json::Value jsonValue(std::move(*obj));
                std::string valueStr = llvm::formatv("{0}", jsonValue).str();
                buffer = valueStr.substr(1, valueStr.size() - 2);
            }
        }
    }

    void write_impl(const char *Ptr, size_t Size) override
    {
        if (Size == 0) {
            return;
        }
        scanKeys(Ptr, Size);
        updateNodeField(Ptr, Size);
        out << buffer;
        buffer.clear();
        bytes += Size;
    }

    uint64_t current_pos() const override
    {
        return bytes;
    }
};

} // namespace ast_dumper
