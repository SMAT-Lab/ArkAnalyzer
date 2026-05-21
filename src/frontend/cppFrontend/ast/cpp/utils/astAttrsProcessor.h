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

#include <llvm/Demangle/Demangle.h>
#include <llvm/Support/JSON.h>
#include "llvm/Support/raw_ostream.h"

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <string>

namespace ast_dumper {

namespace attrs_processor_detail {

constexpr char kOctalMin = '0';
constexpr char kOctalMax = '7';
constexpr unsigned kOctalSize = 4;
constexpr unsigned kByte64 = 64;
constexpr unsigned kByte8 = 8;
constexpr size_t kOne = 1;
constexpr size_t kTwo = 2;
constexpr size_t kThree = 3;

inline void CopyBytes(void *dst, const void *src, size_t len)
{
    if (len == 0) {
        return;
    }
    std::copy_n(static_cast<const char *>(src), len, static_cast<char *>(dst));
}

std::string DecodeNodeMangledName(const std::string &demangle);

inline bool IsOctalDigit(char c)
{
    return c >= kOctalMin && c <= kOctalMax;
}

inline bool IsUtfOctalEscape(const std::string &input, size_t i)
{
    return input[i] == '\\' && i + kThree < input.size() && IsOctalDigit(input[i + kOne]) &&
           IsOctalDigit(input[i + kTwo]) && IsOctalDigit(input[i + kThree]);
}

inline unsigned char DecodeUtfOctalByte(const std::string &input, size_t i)
{
    return static_cast<unsigned char>((input[i + kOne] - kOctalMin) * kByte64 +
                                      (input[i + kTwo] - kOctalMin) * kByte8 +
                                      (input[i + kThree] - kOctalMin));
}

std::string DecodeUtfOctal(const std::string &input);

} // namespace attrs_processor_detail

void ApplyAttrFieldTransforms(llvm::json::Object &obj);

// AstAttrsProcessor wraps JSONNodeDumper output: forwards to an underlying stream,
// tracks whether "name"/"code" keys were emitted, and normalizes selected attr fields.
class AstAttrsProcessor final : public llvm::raw_ostream {
public:
    explicit AstAttrsProcessor(llvm::raw_ostream &out, bool incrementalTransform = true,
                               bool deferOutputToFlush = false)
        : out(out), incrementalTransform(incrementalTransform), deferOutputToFlush(deferOutputToFlush)
    {
    }

    bool HasNameKey() const { return hasName; }
    bool HasCodeKey() const { return hasCode; }
    uint64_t BytesWritten() const { return bytes; }

    void FlushBufferedOutput()
    {
        if (!buffer.empty()) {
            out << buffer;
            buffer.clear();
        }
    }

private:
    llvm::raw_ostream &out;
    bool incrementalTransform = true;
    bool deferOutputToFlush = false;
    std::string buffer;
    uint64_t bytes = 0;
    bool hasName = false;
    bool hasCode = false;

    static constexpr size_t kPatLen = 6;
    static constexpr size_t kTailMax = kPatLen - 1;

    char tail[kTailMax] = {0};
    size_t tailLen = 0;

    static bool FindPatternFixed6(const char *data, size_t len, const char *pat6);

    void MarkKeyIfFound(const char *data, size_t len, const char *pat6, bool &flag);

    void ScanBoundaryKeys(const char *ptr, size_t size, const char *kName, const char *kCode);

    void UpdateTailBuffer(const char *ptr, size_t size);

    void ScanKeys(const char *ptr, size_t size);

    void UpdateNodeField(const char *ptr, size_t size);

    void write_impl(const char *Ptr, size_t Size) override;

    uint64_t current_pos() const override;
};

} // namespace ast_dumper
