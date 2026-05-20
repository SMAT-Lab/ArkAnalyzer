# ArkAnalyzer: Static Program Analysis Framework for the ArkTS Language

[简体中文](./README.md) 

## What is ArkAnalyzer?
ArkAnalyzer is a static code analysis framework for HarmonyOS native applications developed in ArkTS. It supports ArkTS, TypeScript, JavaScript, and C/C++ as inputs. By converting these languages into a unified three-address-code intermediate representation (ArkAnalyzer-IR, or ArkIR), ArkAnalyzer builds a Scene data structure that abstracts the code and implements a series of static analyses on top of the Scene.

## Development environment setup

1. Install [Visual Studio Code](https://code.visualstudio.com/download) or another IDE.
2. Install [Node.js](https://nodejs.org/en/download/current) (includes npm).
3. Install dependencies:
```shell
npm install
```
4. [Optional] Use Docker dev environment (x86_64 Linux):
```shell
# Build image
docker build --platform linux/amd64 -f Dockerfile.dev -t arkanalyzer:dev-amd64 .

# Start container (mount SDK and source; code changes on host take effect immediately)
docker run --platform linux/amd64 -it \
  -v /path/to/command-line-tools:/workspace/command-line-tools \
  -v $(pwd):/workspace/arkanalyzer \
  arkanalyzer:dev-amd64
```
5. [Optional] Generate the latest API documentation under `docs/api_docs`:
```shell
npm run gendoc
```

## Command-line interface (CLI)

The executable is `arkanalyzer` (see the `bin` field in `package.json`). **Build before using the CLI locally** so that `lib/` is generated:

```shell
npm run build
```

Show help:

```shell
npx arkanalyzer --help
npx arkanalyzer cg --help
npx arkanalyzer ir --help
```

`<input>` is the **project root** of an ArkTS/TypeScript project.

### `cg`: call graph and reachability

Usage: `arkanalyzer cg <input> [options]`

| Option | Description | Default |
|--------|-------------|---------|
| `-a, --algorithm <name>` | Graph algorithm: `cha` \| `rta` | `rta` |
| `-o, --output <file>` | Output file path | `stdout` |
| `-f, --format <type>` | Output format: `json` \| `text` \| `dot` \| `csv` | `json` |
| `-e, --entry <method>` | Entry method (repeatable); `@dummyMain` means default entries | auto |
| `-r, --reachable-from <method>` | Reachability roots (repeatable) | — |
| `--direction <dir>` | `forward` (callees) \| `backward` (callers toward roots) | `forward` |
| `--edges <type>` | Edge filter: `call` \| `virtual` \| `interface` \| `all` | `all` |
| `--ohos-sdk-home <path>` | OpenHarmony SDK root; falls back to `OHOS_SDK_HOME` | — |

Examples:

```shell
npx arkanalyzer cg ./myapp -a rta -f json
npx arkanalyzer cg ./myapp -e "@dummyMain" -r MyClass.myMethod --direction backward -f text
```

### `ir`: export IR artifacts

Usage: `arkanalyzer ir <input> [options]`

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <dir>` | Output directory for artifacts | `out` |
| `-f, --format <type>` | `json` \| `text` \| `dot` | `text` |
| `--ohos-sdk-home <path>` | Same as `cg` | — |
| `--no-infer-types` | Skip `Scene.inferTypes()` for speed | inference on by default |

The command prints one line of JSON summary to **stdout** (fields such as `input`, `format`, `outputDir`, `fileCount`).

Examples:

```shell
npx arkanalyzer ir ./myapp -f text -o ./out
npx arkanalyzer ir ./myapp -f json -o ./out
```

For detailed option semantics and examples, see [skills/arkanalyzer/skills/cg.md](skills/arkanalyzer/skills/cg.md) and [skills/arkanalyzer/skills/ir.md](skills/arkanalyzer/skills/ir.md).

## Documentation

1. Quick start: [QuickStart.md](docs/QuickStart.md).
2. Full user manual: [ArkAnalyzer Documentation](docs/README.md).
3. API reference: [globals.md](docs/api_docs/globals.md).
4. Program Analysis SIG: [English](docs/sig_programanalysis.en.md).


## Supported Use Cases (by Language)

ArkAnalyzer compiles every supported source language into a unified **ArkIR** (three-address intermediate representation), so downstream analyses ([CallGraph](docs/analysis/CallGraph.md), [Def-Use Chain](docs/analysis/Def-Use%20Chain.md), [DataFlow](docs/analysis/DataFlow.md), [ViewTree](docs/analysis/ViewTree.md), …) work uniformly across languages. Maturity differences are mostly in **frontend coverage** and **type-inference precision**; see [docs/MultiLanguageSupport.md](docs/MultiLanguageSupport.md) for the detailed matrix.

| Language | `Language` enum | IR lowering | Type inference | Call graph (CHA / RTA) | Def-Use / intraprocedural data flow | ViewTree | Notes |
|----------|-----------------|-------------|----------------|------------------------|----------------|----------|-------|
| ArkTS 1.1 | `ARKTS1_1` | ✅ full | ✅ full (incl. decorators) | ✅ | ✅ | ✅ | HarmonyOS first-class; the only language with ArkUI view-tree analysis |
| TypeScript | `TYPESCRIPT` | ✅ full | ✅ full | ✅ | ✅ | — | Vanilla TS projects; namespaces, generics, decorators, `type`/`interface`, etc. |
| JavaScript | `JAVASCRIPT` | ✅ basic | ⚠ limited (falls back to `UnknownType` without annotations) | ✅ | ✅ | — | Good for sketching dynamic call relations; for precision, prefer TS annotations |
| C / C++ | `CXX` | ✅ (cppFrontend) | ⚠ partial | ✅ | ✅ | — | Requires `cppAstPath` / `ccjsonPath`; supports `VIRTUAL`, `INLINE`, `CONSTEXPR`, `MUTABLE`, …; targets HarmonyOS native modules |
| ABC (ArkCompiler bytecode) | `ABC` | ⚠ experimental | — | — | — | — | Direct bytecode read, mainly for IR validation |

**Typical scenarios**:

- **HarmonyOS / ArkTS applications**: ArkUI view-tree analysis ([ViewTree](docs/analysis/ViewTree.md)) + state-dependency tracking + `@State` side-effect checks; multi-module projects are auto-detected via [`Scene.buildScene4HarmonyProject()`](docs/components/Scene.md#51-构建-scene).
- **TS / JS libraries or server-side projects**: [CallGraph](docs/analysis/CallGraph.md) (CHA / RTA) + [Def-Use Chain](docs/analysis/Def-Use%20Chain.md) + [DataFlow](docs/analysis/DataFlow.md) (`MFPDataFlowSolver`, reaching definitions, or custom problems).
- **Mixed TS/ArkTS + C/C++ projects**: use `ArkClass.getTs2cxxFuncMap()` to bridge TS-side `napi_*` calls to their C/C++ implementations for cross-language reachability.

For a finer-grained capability matrix and IR differences across languages, see [docs/MultiLanguageSupport.md](docs/MultiLanguageSupport.md).

## UT log switch
Vitest unit tests run quietly by default, without verbose UT logs.

When troubleshooting, set `V=1` to enable verbose logs (both console output and file log at `output/ArkAnalyzerUT.log`):

```shell
V=1 npx vitest run
```

## Contributing

If you run into problems while using ArkAnalyzer, please follow the [Issue Submission Guide](docs/contributing/HowToHandleIssues.md) to open an issue.
Contributions are welcome — when submitting a PR, please follow the openharmony-sig repository conventions. See the [PR Submission Guide](docs/contributing/HowToCreatePR.md#english) for the full process.

## Release History
For version history and change logs, see: [CHANGELOG](CHANGELOG.md)

