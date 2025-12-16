#pragma once

#include <string>

#include "clang/Basic/SourceLocation.h"
#include "clang/Basic/SourceManager.h"
#include "clang/Basic/LangOptions.h"

namespace ast_dumper {

// main-file check (macro expansion included)
bool IsFromMainFileIncludingExpansion(const clang::SourceManager &SM,
                                      clang::SourceLocation Loc);

// extract source text for a range (default: expansion range)
std::string GetSourceTextByRange(const clang::SourceManager &SM,
                                 const clang::LangOptions &LO,
                                 clang::SourceRange SR,
                                 bool UseExpansionRange = true);

} // namespace ast_dumper
