#include "utils/output_path.h"

#include "llvm/ADT/SmallString.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"

namespace ast_dumper {

std::string DefaultOutPathForInput(llvm::StringRef inFile)
{
    llvm::SmallString<256> dir = llvm::sys::path::parent_path(inFile);
    llvm::SmallString<256> base = llvm::sys::path::filename(inFile);
    llvm::sys::path::replace_extension(base, "");

    llvm::SmallString<256> out = dir;
    llvm::sys::path::append(out, (llvm::Twine(base) + "_AST.json").str());
    return out.str().str();
}

bool LooksLikeDirectoryPath(llvm::StringRef p)
{
    if (p.empty()) return false;

    char last = p.back();
    if (last == '/' || last == '\\') return true;

    llvm::sys::fs::file_status st;
    return (!llvm::sys::fs::status(p, st) && llvm::sys::fs::is_directory(st));
}

std::string ComputeOutPath(llvm::StringRef inFile, llvm::StringRef o, unsigned inputCount)
{
    if (o.empty()) return DefaultOutPathForInput(inFile);
    if (o == "-") return "-";

    if (LooksLikeDirectoryPath(o)) {
        llvm::SmallString<256> dir(o);
        llvm::SmallString<256> base = llvm::sys::path::filename(inFile);
        llvm::sys::path::replace_extension(base, "");

        llvm::SmallString<256> out = dir;
        llvm::sys::path::append(out, (llvm::Twine(base) + "_AST.json").str());
        return out.str().str();
    }

    // -o is a file
    if (inputCount <= 1) return o.str();

    llvm::SmallString<256> oPath(o);
    llvm::SmallString<256> oDir = llvm::sys::path::parent_path(oPath);
    llvm::SmallString<256> oFile = llvm::sys::path::filename(oPath);

    llvm::SmallString<256> oStem = oFile;
    llvm::sys::path::replace_extension(oStem, "");

    llvm::SmallString<256> inBase = llvm::sys::path::filename(inFile);
    llvm::sys::path::replace_extension(inBase, "");

    llvm::SmallString<256> ext = llvm::sys::path::extension(oFile);
    std::string extStr = ext.empty() ? ".json" : ext.str().str();

    llvm::SmallString<256> out = oDir;
    llvm::sys::path::append(out, (llvm::Twine(oStem) + "_" + inBase + extStr).str());
    return out.str().str();
}

} // namespace ast_dumper
