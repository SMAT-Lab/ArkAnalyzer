[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CompletionEntryDataAutoImport

# Interface: CompletionEntryDataAutoImport

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6984

## Extended by

- [`CompletionEntryDataUnresolved`](CompletionEntryDataUnresolved.md)
- [`CompletionEntryDataResolved`](CompletionEntryDataResolved.md)

## Properties

### ambientModuleName?

> `optional` **ambientModuleName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6994

The module name (with quotes stripped) of the export's module symbol, if it was an ambient module

***

### exportName

> **exportName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6989

The name of the property or export in the module's symbol table. Differs from the completion name
in the case of InternalSymbolName.ExportEquals and InternalSymbolName.Default.

***

### fileName?

> `optional` **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6992

The file name declaring the export's module symbol, if it was an external module

***

### isPackageJsonImport?

> `optional` **isPackageJsonImport**: `true`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6996

True if the export was found in the package.json AutoImportProvider

***

### moduleSpecifier?

> `optional` **moduleSpecifier**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6990
