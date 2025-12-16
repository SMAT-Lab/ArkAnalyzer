#include "utils/header_units.h"

#include "clang/Basic/SourceManager.h"
#include "clang/Lex/Lexer.h"
#include "clang/Lex/Preprocessor.h"

namespace ast_dumper {

HeaderFileCollector::HeaderFileCollector(clang::SourceManager &SM,
                                         clang::Preprocessor &PP,
                                         std::shared_ptr<HeaderUnitsStore> Store)
    : SM(SM), PP(PP), Store(std::move(Store)) {}

void HeaderFileCollector::InclusionDirective(clang::SourceLocation HashLoc,
                                             const clang::Token &,
                                             llvm::StringRef FileName,
                                             bool IsAngled,
                                             clang::CharSourceRange,
                                             clang::OptionalFileEntryRef File,
                                             llvm::StringRef SearchPath,
                                             llvm::StringRef RelativePath,
                                             const clang::Module *,
                                             bool,
                                             clang::SrcMgr::CharacteristicKind)
{
    llvm::json::Object inc;
    inc["kind"] = "InclusionDirective";
    inc["includeName"] = FileName.str();
    inc["isAngled"] = IsAngled;
    inc["searchPath"] = SearchPath.str();
    inc["relativePath"] = RelativePath.str();

    // includedFrom: file containing this #include
    {
        clang::FileID FID = SM.getFileID(HashLoc);
        if (FID.isValid()) {
            if (const clang::FileEntry *FE = SM.getFileEntryForID(FID))
                inc["includedFrom"] = FE->tryGetRealPathName().str();
        }
    }

    // fileName: resolved header path (if available)
    std::string headerAbs;
    if (File.has_value()) {
        headerAbs = File->getFileEntry().tryGetRealPathName().str();
        inc["fileName"] = headerAbs;
    }

    // loc: expansion position
    {
        clang::SourceLocation E = SM.getExpansionLoc(HashLoc);
        if (E.isValid()) {
            clang::PresumedLoc PL = SM.getPresumedLoc(E);
            if (PL.isValid()) {
                inc["loc"] = llvm::json::Object{
                    {"file", std::string(PL.getFilename())},
                    {"line", (int64_t)PL.getLine()},
                    {"col",  (int64_t)PL.getColumn()},
                };
            }
        }
    }

    // code: full "#include ..." line
    {
        clang::SourceLocation E = SM.getExpansionLoc(HashLoc);
        if (E.isValid()) {
            clang::FileID FID = SM.getFileID(E);
            unsigned LineNo = SM.getSpellingLineNumber(E);
            clang::SourceLocation LB = SM.translateLineCol(FID, LineNo, 1);
            clang::SourceLocation LNext = SM.translateLineCol(FID, LineNo + 1, 1);

            clang::CharSourceRange CR = (LNext.isValid())
                ? clang::CharSourceRange::getCharRange(LB, LNext)
                : clang::CharSourceRange::getCharRange(LB, SM.getLocForEndOfFile(FID));

            inc["code"] = clang::Lexer::getSourceText(CR, SM, PP.getLangOpts()).str();
        }
    }

    // aggregate
    std::string key = !headerAbs.empty() ? headerAbs : ("<unresolved>:" + FileName.str());
    llvm::json::Object &HU = Store->ByHeader[key];
    HU["header"] = key;
    if (!HU.get("includes")) HU["includes"] = llvm::json::Array{};
    HU["includes"].getAsArray()->push_back(llvm::json::Value(std::move(inc)));
}

} // namespace ast_dumper
