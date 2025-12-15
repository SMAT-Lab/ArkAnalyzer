#pragma once

#include "clang/Tooling/ArgumentsAdjusters.h"
#include "clang/Tooling/CompilationDatabase.h"
#include "llvm/ADT/ArrayRef.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/raw_ostream.h"

#include <memory>
#include <string>
#include <vector>

namespace ast_dumper {

// Parse "-p <build_dir>" from argv (for debug/diagnostics only).
std::string GetBuildPathFromArgv(int argc, const char **argv);

// Print basic checks for build dir + compile_commands.json + loadFromDirectory().
void PrintBuildPathDiagnostics(llvm::StringRef BuildPath, llvm::raw_ostream &OS);

// True if DB contains compile commands for any input file (tries slash-normalization on Windows).
bool HasCompileCommandForAnyInput(clang::tooling::CompilationDatabase &DB,
                                  llvm::ArrayRef<std::string> Inputs);

// Create a minimal fallback DB when no compile command is found.
std::unique_ptr<clang::tooling::CompilationDatabase>
MakeFallbackDB(llvm::ArrayRef<std::string> Inputs);

// Select DB for inputs; returns ParserDB or OwnedFallback.get().
clang::tooling::CompilationDatabase *SelectDBForInputs(
    clang::tooling::CompilationDatabase &ParserDB,
    llvm::ArrayRef<std::string> Inputs,
    std::unique_ptr<clang::tooling::CompilationDatabase> &OwnedFallback,
    llvm::raw_ostream &Log);

// OHOS: inject libc++ headers (include/c++/v1) + prefer -stdlib=libc++ for OHOS targets only.
clang::tooling::ArgumentsAdjuster MakeOhosLibcxxFixAdjuster();

} // namespace ast_dumper
