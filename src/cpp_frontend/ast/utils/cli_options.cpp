#include "utils/cli_options.h"

namespace ast_dumper::cli {

llvm::cl::OptionCategory &JsonASTCategory()
{
    static llvm::cl::OptionCategory Cat("json-ast options");
    return Cat;
}

llvm::cl::opt<std::string> &OutputFilename()
{
    static llvm::cl::opt<std::string> Opt(
        "o",
        llvm::cl::desc(
            "Output file/dir for JSON AST.\n"
            "Default: <input_dir>/<input_stem>_AST.json\n"
            "Use '-' for stdout.\n"
            "If -o is a directory (existing or endswith / or \\): outputs are placed under it.\n"
            "If -o is a file:\n"
            "  - single input: output EXACTLY to that file (no auto suffix)\n"
            "  - multiple inputs: output to <o_dir>/<o_stem>_<input_stem><o_ext> (no _AST)"),
        llvm::cl::value_desc("path"),
        llvm::cl::cat(JsonASTCategory()));
    return Opt;
}

static llvm::cl::extrahelp &MoreHelp()
{
    static llvm::cl::extrahelp H(R"(
BUILD PATH OPTION:
  The '-p' option specifies the directory containing compile_commands.json.
)");
    return H;
}

void EnsureRegistered()
{
    (void)OutputFilename(); // Force construction/registration of the static cl::opt
    (void)MoreHelp();       // Force registration of the extra help text (otherwise it won't show up in -help)
}


} // namespace ast_dumper::cli
