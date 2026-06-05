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

#include <cstdint>
#include <memory>
#include <string>
#include <vector>

namespace clang {
class ASTContext;
}

namespace ast_dumper {
struct HeaderUnitsStore;
}

namespace ark_cxx_ast_flat {

/** Serializes one TU to FlatBuffers bytes (structured columns + nested inner wire). */
class CxxAstFlatStreamer {
public:
    explicit CxxAstFlatStreamer(clang::ASTContext &ctx, std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore);

    ~CxxAstFlatStreamer();

    void EmitTranslationUnit();

    /** \p flatPath is stored in payload metadata (file is written separately). */
    std::vector<uint8_t> Finish(const std::string &sourceFile, const std::string &flatPath);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

/** Write flat bytes to \p outPath (parent dirs created). Returns false on I/O error. */
bool WriteFlatPayloadToFile(const std::vector<uint8_t> &bytes, const std::string &outPath);

} // namespace ark_cxx_ast_flat
