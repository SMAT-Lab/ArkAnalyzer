# ArkAnalyzer: Static Program Analysis Framework for the ArkTS Language

[简体中文](./README.md) 

## Development environment setup

1. Install [Visual Studio Code](https://code.visualstudio.com/download) or another IDE.
2. Install [Node.js](https://nodejs.org/en/download/current) (includes npm).
3. Install dependencies:
```shell
npm install
```
4. [Optional] Generate the latest API documentation under `docs/api_docs`:
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
2. API reference: [globals.md](docs/api_docs/globals.md).
3. Program Analysis SIG: [English](docs/sig_programanalysis.en.md).

## Contributing

Follow the OpenHarmony-SIG contribution workflow: [HowToCreatePR.md (English)](docs/HowToCreatePR.md#english).

## Debugging

Set the `args` array in `.vscode/launch.json` to the file path you want to debug, then start debugging.

## Adding test cases

Place new tests under `tests/`. Sample code and other resources go under `tests/resources/`, organized in folders per scenario.

## Issues

See [HowToHandleIssues.md](docs/HowToHandleIssues.md) to file issues.
