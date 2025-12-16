#include "utils/json_streaming.h"

#include "llvm/Support/FormatVariadic.h"
#include "llvm/Support/JSON.h"
#include "llvm/Support/raw_ostream.h"

namespace ast_dumper::json {

void PrintJsonString(llvm::raw_ostream &OS, llvm::StringRef S)
{
    OS << llvm::formatv("{0}", llvm::json::Value(S));
}

void WriteKey(llvm::raw_ostream &OS, llvm::StringRef Key)
{
    OS << '"' << Key << "\":";
}

void WriteCommaIf(bool &WroteAnyField, llvm::raw_ostream &OS)
{
    if (WroteAnyField) OS << ',';
    WroteAnyField = true;
}

} // namespace ast_dumper::json
