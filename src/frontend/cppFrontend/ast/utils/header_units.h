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

#include <map>
#include <memory>
#include <string>

#include "clang/Lex/PPCallbacks.h"
#include "llvm/Support/JSON.h"

namespace ast_dumper {

// ---- headerUnits store ----
// key: included header path (prefer realpath), fallback "<unresolved>:name"
// val: { "header": "...", "includes": [ {..}, ... ] }
struct HeaderUnitsStore {
    std::map<std::string, llvm::json::Object> ByHeader;
};

// ---- PPCallbacks: collect #include ----
class HeaderFileCollector final : public clang::PPCallbacks {
public:
    HeaderFileCollector(clang::SourceManager &SM,
                        clang::Preprocessor &PP,
                        std::shared_ptr<HeaderUnitsStore> store);

    void InclusionDirective(clang::SourceLocation HashLoc,
                            const clang::Token &IncludeTok,
                            llvm::StringRef FileName,
                            bool IsAngled,
                            clang::CharSourceRange FilenameRange,
                            clang::OptionalFileEntryRef File,
                            llvm::StringRef SearchPath,
                            llvm::StringRef RelativePath,
                            const clang::Module *Imported,
                            bool FileType,
                            clang::SrcMgr::CharacteristicKind FileChar) override;

private:
    clang::SourceManager &SM;
    clang::Preprocessor &PP;
    std::shared_ptr<HeaderUnitsStore> store;
    std::string currentFile;
    std::vector<std::string> headerFileSet;
};

} // namespace ast_dumper
