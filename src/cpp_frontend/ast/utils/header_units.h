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
                        std::shared_ptr<HeaderUnitsStore> Store);

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
    std::shared_ptr<HeaderUnitsStore> Store;
};

} // namespace ast_dumper
