#include "utils/source_utils.h"

#include "clang/Lex/Lexer.h"

namespace ast_dumper {

bool IsFromMainFileIncludingExpansion(const clang::SourceManager &SM,
                                      clang::SourceLocation Loc)
{
    if (Loc.isInvalid()) return false;
    clang::SourceLocation E = SM.getExpansionLoc(Loc);
    return E.isValid() && SM.isWrittenInMainFile(E);
}

std::string GetSourceTextByRange(const clang::SourceManager &SM,
                                 const clang::LangOptions &LO,
                                 clang::SourceRange SR,
                                 bool UseExpansionRange)
{
    if (SR.isInvalid()) return "";
    clang::CharSourceRange CR = UseExpansionRange
        ? SM.getExpansionRange(SR)
        : clang::CharSourceRange::getTokenRange(SR);
    if (CR.isInvalid()) return "";
    return clang::Lexer::getSourceText(CR, SM, LO).str();
}

} // namespace ast_dumper
