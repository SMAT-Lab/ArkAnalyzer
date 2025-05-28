[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / PackageId

# Interface: PackageId

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3393

Unique identifier with a package name and version.
If changing this, remember to change `packageIdIsEqual`.

## Properties

### name

> **name**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3399

Name of the package.
Should not include `@types`.
If accessing a non-index file, this should include its name e.g. "foo/bar".

***

### subModuleName

> **subModuleName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3404

Name of a submodule within this package.
May be "".

***

### version

> **version**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3406

Version of the package, e.g. "1.2.3"
