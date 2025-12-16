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
    uint64_t Bytes = 0;
    bool HasName = false;
    bool HasCode = false;

    // "\"name\"" and "\"code\"" are both length 6.
    static constexpr size_t kPatLen = 6;
    static constexpr size_t kTailMax = kPatLen - 1;

    char Tail[kTailMax] = {0};
    size_t TailLen = 0;

    static bool findPatternFixed6(const char *Data, size_t Len, const char *Pat6) {
        if (Len < kPatLen) return false;
        for (size_t i = 0; i + kPatLen <= Len; ++i) {
            if (std::memcmp(Data + i, Pat6, kPatLen) == 0) return true;
        }
        return false;
    }

    void scanKeys(const char *Ptr, size_t Size) {
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

            if (!HasName && findPatternFixed6(buf, total, kName)) HasName = true;
            if (!HasCode && findPatternFixed6(buf, total, kCode)) HasCode = true;
        }

        // chunk
        if (!HasName && findPatternFixed6(Ptr, Size, kName)) HasName = true;
        if (!HasCode && findPatternFixed6(Ptr, Size, kCode)) HasCode = true;

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

    void write_impl(const char *Ptr, size_t Size) override {
        if (Size == 0) return;
        scanKeys(Ptr, Size);
        Out.write(Ptr, Size);
        Bytes += Size;
    }

    uint64_t current_pos() const override { return Bytes; }
};

} // namespace ast_dumper
