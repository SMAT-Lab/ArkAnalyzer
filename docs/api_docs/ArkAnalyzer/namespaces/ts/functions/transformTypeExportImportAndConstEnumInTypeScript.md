[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / transformTypeExportImportAndConstEnumInTypeScript

# Function: transformTypeExportImportAndConstEnumInTypeScript()

> **transformTypeExportImportAndConstEnumInTypeScript**(`context`): (`node`) => [`SourceFile`](../interfaces/SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5440

Add 'type' flag to import/export when import/export an type member.
Replace const enum with number and string literal.

## Parameters

### context

[`TransformationContext`](../interfaces/TransformationContext.md)

## Returns

> (`node`): [`SourceFile`](../interfaces/SourceFile.md)

### Parameters

#### node

[`SourceFile`](../interfaces/SourceFile.md)

### Returns

[`SourceFile`](../interfaces/SourceFile.md)
