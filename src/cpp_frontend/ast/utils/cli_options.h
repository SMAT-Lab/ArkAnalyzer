#pragma once

#include <string>
#include "llvm/Support/CommandLine.h"

namespace ast_dumper::cli {

// Returns references to static objects (their lifetime lasts for the entire process).
llvm::cl::OptionCategory &JsonASTCategory();
llvm::cl::opt<std::string> &OutputFilename();

// Ensures all CLI options are registered before parsing argv (critical).
void EnsureRegistered();

} // namespace ast_dumper::cli
