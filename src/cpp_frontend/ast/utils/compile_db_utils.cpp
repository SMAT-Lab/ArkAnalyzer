#include "compile_db_utils.h"

#include "clang/Tooling/CompilationDatabase.h"

#include "llvm/ADT/SmallString.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"

#include <algorithm>
#include <cstring>

namespace ast_dumper {

static bool EndsWith(const std::string &s, const char *suffix)
{
    const size_t n = std::strlen(suffix);
    return s.size() >= n && s.compare(s.size() - n, n, suffix) == 0;
}

static std::string NormalizeBackslashToSlash(std::string p)
{
    for (char &ch : p) if (ch == '\\') ch = '/';
    return p;
}

std::string GetBuildPathFromArgv(int argc, const char **argv)
{
    for (int i = 0; i + 1 < argc; ++i) {
        if (std::strcmp(argv[i], "-p") == 0) return std::string(argv[i + 1]);
    }
    return {};
}

void PrintBuildPathDiagnostics(llvm::StringRef BuildPath, llvm::raw_ostream &OS)
{
    if (BuildPath.empty()) return;

    OS << "[ASTDumper] -p = " << BuildPath << "\n";
    OS << "[ASTDumper] exists(build dir) = "
       << (llvm::sys::fs::exists(BuildPath) ? "yes" : "no") << "\n";

    llvm::SmallString<512> CC(BuildPath);
    llvm::sys::path::append(CC, "compile_commands.json");
    OS << "[ASTDumper] exists(compile_commands.json) = "
       << (llvm::sys::fs::exists(CC) ? "yes" : "no") << "\n";

    std::string Err;
    auto TestDB = clang::tooling::CompilationDatabase::loadFromDirectory(BuildPath, Err);
    OS << "[ASTDumper] loadFromDirectory = " << (TestDB ? "OK" : "FAILED") << "\n";
    if (!TestDB && !Err.empty()) OS << "[ASTDumper] load error: " << Err << "\n";
}

bool HasCompileCommandForAnyInput(clang::tooling::CompilationDatabase &DB, llvm::ArrayRef<std::string> Inputs)
{
    for (const auto &p : Inputs) {
        auto cmds = DB.getCompileCommands(p);
        if (!cmds.empty()) return true;

        // Windows: compile_commands may record '/' paths while inputs are '\'.
        auto p2 = NormalizeBackslashToSlash(p);
        cmds = DB.getCompileCommands(p2);
        if (!cmds.empty()) return true;
    }
    return false;
}

std::unique_ptr<clang::tooling::CompilationDatabase>
MakeFallbackDB(llvm::ArrayRef<std::string> Inputs)
{
    bool hasC = false, hasCxx = false;
    for (const auto &f : Inputs) {
        if (EndsWith(f, ".c")) hasC = true;
        if (EndsWith(f, ".cc") || EndsWith(f, ".cpp") || EndsWith(f, ".cxx") ||
            EndsWith(f, ".h")  || EndsWith(f, ".hpp")) hasCxx = true;
    }

    std::vector<std::string> args;
    args.push_back((hasCxx && !hasC) ? "-std=c++20" : (hasC && !hasCxx) ? "-std=c99" : "-std=c++20");
    args.push_back("-fsyntax-only");
    return std::make_unique<clang::tooling::FixedCompilationDatabase>(".", args);
}

clang::tooling::CompilationDatabase *SelectDBForInputs(
    clang::tooling::CompilationDatabase &ParserDB,
    llvm::ArrayRef<std::string> Inputs,
    std::unique_ptr<clang::tooling::CompilationDatabase> &OwnedFallback,
    llvm::raw_ostream &Log)
{

    if (HasCompileCommandForAnyInput(ParserDB, Inputs)) return &ParserDB;

    Log << "[ASTDumper] No compile command for inputs. Use fallback compile flags.\n";
    OwnedFallback = MakeFallbackDB(Inputs);
    return OwnedFallback.get();
}

clang::tooling::ArgumentsAdjuster MakeOhosLibcxxFixAdjuster()
{
    using clang::tooling::CommandLineArguments;

    return clang::tooling::ArgumentsAdjuster(
        [](const CommandLineArguments &Args, llvm::StringRef /*File*/) {
            CommandLineArguments NewArgs = Args;

            auto containsSubstr = [&](llvm::StringRef sub) {
                for (const auto &a : NewArgs)
                    if (llvm::StringRef(a).contains(sub)) return true;
                return false;
            };
            auto hasExact = [&](llvm::StringRef exact) {
                for (const auto &a : NewArgs)
                    if (llvm::StringRef(a) == exact) return true;
                return false;
            };

            // Only touch OHOS TUs.
            bool isOhosTarget = false;
            for (const auto &a : NewArgs) {
                llvm::StringRef R(a);
                if (R.starts_with("--target=") && R.contains("ohos")) { isOhosTarget = true; break; }
            }
            if (!isOhosTarget) return NewArgs;

            // Find --gcc-toolchain=...
            std::string gccToolchain;
            for (const auto &a : NewArgs) {
                llvm::StringRef R(a);
                if (R.starts_with("--gcc-toolchain=")) {
                    gccToolchain = R.substr(std::strlen("--gcc-toolchain=")).str();
                    break;
                }
            }

            // Inject libc++ headers: <toolchain>/include/c++/v1 (some OHOS ccjson misses it).
            if (!gccToolchain.empty() && !containsSubstr("include/c++/v1")) {
                llvm::SmallString<512> P(gccToolchain);
                llvm::sys::path::append(P, "include", "c++", "v1");
                if (llvm::sys::fs::exists(P)) {
                    NewArgs.push_back("-isystem");
                    NewArgs.push_back(P.str().str());
                }
            }

            // Prefer libc++ only if user/ccjson didn't specify.
            if (!containsSubstr("-stdlib=")) NewArgs.push_back("-stdlib=libc++");

            // -nostdinc++ disables standard C++ headers; remove for OHOS parsing.
            if (hasExact("-nostdinc++")) {
                NewArgs.erase(std::remove(NewArgs.begin(), NewArgs.end(), std::string("-nostdinc++")),
                              NewArgs.end());
            }

            return NewArgs;
        }
    );
}

} // namespace ast_dumper
