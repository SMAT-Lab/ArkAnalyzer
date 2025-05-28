[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / parseModuleFromPath

# Function: parseModuleFromPath()

> **parseModuleFromPath**(`resolved`, `packageManagerType?`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5417

This will be called on the successfully resolved path from `loadModuleFromFile`.
(Not needed for `loadModuleFromNodeModules` as that looks up the `package.json` or `oh-package.json5` as part of resolution.)

packageDirectory is the directory of the package itself.
  For `blah/node_modules/foo/index.d.ts` this is packageDirectory: "foo"
  For `/node_modules/foo/bar.d.ts` this is packageDirectory: "foo"
  For `/node_modules/@types/foo/bar/index.d.ts` this is packageDirectory: "@types/foo"
  For `/node_modules/foo/bar/index.d.ts` this is packageDirectory: "foo"

## Parameters

### resolved

`string`

### packageManagerType?

`string`

## Returns

`undefined` \| `string`
