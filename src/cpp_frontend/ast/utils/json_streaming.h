#pragma once

#include "llvm/ADT/StringRef.h"

namespace llvm {
class raw_ostream;
}

namespace ast_dumper::json {

// Escapes and writes a JSON string (quoted + escaped).
void PrintJsonString(llvm::raw_ostream &OS, llvm::StringRef S);

// Writes a JSON key (e.g., "key":).
void WriteKey(llvm::raw_ostream &OS, llvm::StringRef Key);

// If a field has already been written, outputs ',' and sets WroteAnyField to true.
void WriteCommaIf(bool &WroteAnyField, llvm::raw_ostream &OS);


} // namespace ast_dumper::json
