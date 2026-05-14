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
#include "utils/source_utils.h"

#include "clang/Lex/Lexer.h"

namespace ast_dumper {
    
bool IsFromMainFileIncludingExpansion(const clang::SourceManager &sm, clang::SourceLocation loc)
{
    if (loc.isInvalid()) {
        return false;
    }
    clang::SourceLocation sl = sm.getExpansionLoc(loc);
    return sl.isValid() && sm.isWrittenInMainFile(sl);
}

std::string GetSourceTextByRange(const clang::SourceManager &sm,
                                 const clang::LangOptions &lo,
                                 clang::SourceRange sr,
                                 bool useExpansionRange)
{
    if (sr.isInvalid()) {
        return "";
    }
    clang::CharSourceRange cr = useExpansionRange ?
        sm.getExpansionRange(sr) : clang::CharSourceRange::getTokenRange(sr);
    if (cr.isInvalid()) {
        return "";
    }
    llvm::StringRef text = clang::Lexer::getSourceText(cr, sm, lo);
    return text.str();
}

} // namespace ast_dumper