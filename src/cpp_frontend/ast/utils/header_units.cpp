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
#include "utils/header_units.h"

#include "clang/Basic/SourceManager.h"
#include "clang/Lex/Lexer.h"
#include "clang/Lex/Preprocessor.h"

namespace ast_dumper {

HeaderFileCollector::HeaderFileCollector(clang::SourceManager &SM,
                                         clang::Preprocessor &PP,
                                         std::shared_ptr<HeaderUnitsStore> store)
    : SM(SM), PP(PP), store(std::move(store))
{
    clang::FileID MainFileID = SM.getMainFileID();
    const clang::FileEntry *MainFile = SM.getFileEntryForID(MainFileID);
    CurrentFile = MainFile->tryGetRealPathName().str();
}

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
    clang::FileID FID = SM.getFileID(HashLoc);
    if (FID.isValid()) {
        if (const clang::FileEntry *FE = SM.getFileEntryForID(FID)) {
            inc["includedFrom"] = FE->tryGetRealPathName().str();
        }
    }

    if (inc.getString("includedFrom") != currentFile ||
        std::find(headerFileSet.begin(), headerFileSet.end(), FileName.str()) != headerFileSet.end()) {
        return;
    }
    headerFileSet.push_back(FileName.str());
    // fileName: resolved header path (if available)
    std::string headerAbs;
    if (File.has_value()) {
        headerAbs = File->getFileEntry().tryGetRealPathName().str();
        inc["fileName"] = headerAbs;
    }

    // loc: expansion position
    clang::SourceLocation expansion = SM.getExpansionLoc(HashLoc);
    if (expansion.isValid()) {
        clang::PresumedLoc PL = SM.getPresumedLoc(expansion);
        if (PL.isValid()) {
            inc["loc"] = llvm::json::Object{{"file", std::string(PL.getFilename())}, {"line", (int64_t)PL.getLine()},
                {"col",  (int64_t)PL.getColumn()}};
        }
    }

    // code: full "#include ..." line
    clang::SourceLocation codeLoc = SM.getExpansionLoc(HashLoc);
    if (codeLoc.isValid()) {
        clang::FileID FID = SM.getFileID(codeLoc);
        unsigned LineNo = SM.getSpellingLineNumber(codeLoc);
        clang::SourceLocation LB = SM.translateLineCol(FID, LineNo, 1);
        clang::SourceLocation LNext = SM.translateLineCol(FID, LineNo + 1, 1);

        clang::CharSourceRange CR = (LNext.isValid())
            ? clang::CharSourceRange::getCharRange(LB, LNext)
            : clang::CharSourceRange::getCharRange(LB, SM.getLocForEndOfFile(FID));

        inc["code"] = clang::Lexer::getSourceText(CR, SM, PP.getLangOpts()).str();
    }

    // aggregate
    std::string key = !headerAbs.empty() ? headerAbs : ("<unresolved>:" + FileName.str());
    llvm::json::Object &HU = store->ByHeader[key];
    HU["header"] = key;
    if (!HU.get("includes")) {
        HU["includes"] = llvm::json::Array{};
    }
    HU["includes"].getAsArray()->push_back(llvm::json::Value(std::move(inc)));
}

} // namespace ast_dumper
