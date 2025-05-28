[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CompletionEntryDataUnresolved

# Interface: CompletionEntryDataUnresolved

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6998

## Extends

- [`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md)

## Properties

### ambientModuleName?

> `optional` **ambientModuleName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6994

The module name (with quotes stripped) of the export's module symbol, if it was an ambient module

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`ambientModuleName`](CompletionEntryDataAutoImport.md#ambientmodulename)

***

### exportMapKey

> **exportMapKey**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7000

The key in the `ExportMapCache` where the completion entry's `SymbolExportInfo[]` is found

***

### exportName

> **exportName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6989

The name of the property or export in the module's symbol table. Differs from the completion name
in the case of InternalSymbolName.ExportEquals and InternalSymbolName.Default.

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`exportName`](CompletionEntryDataAutoImport.md#exportname)

***

### fileName?

> `optional` **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6992

The file name declaring the export's module symbol, if it was an external module

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`fileName`](CompletionEntryDataAutoImport.md#filename)

***

### isPackageJsonImport?

> `optional` **isPackageJsonImport**: `true`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6996

True if the export was found in the package.json AutoImportProvider

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`isPackageJsonImport`](CompletionEntryDataAutoImport.md#ispackagejsonimport)

***

### moduleSpecifier?

> `optional` **moduleSpecifier**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6990

#### Inherited from

[`CompletionEntryDataAutoImport`](CompletionEntryDataAutoImport.md).[`moduleSpecifier`](CompletionEntryDataAutoImport.md#modulespecifier)
