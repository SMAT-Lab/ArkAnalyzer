#pragma once

#include <string>

#include "llvm/ADT/StringRef.h"

namespace ast_dumper {

// default output: <input_dir>/<stem>_AST.json
std::string DefaultOutPathForInput(llvm::StringRef inFile);

bool LooksLikeDirectoryPath(llvm::StringRef path);

// compute output path (stdout / dir / file with single/multi behavior)
std::string ComputeOutPath(llvm::StringRef inFile,
                           llvm::StringRef o,
                           unsigned inputCount);

} // namespace ast_dumper
