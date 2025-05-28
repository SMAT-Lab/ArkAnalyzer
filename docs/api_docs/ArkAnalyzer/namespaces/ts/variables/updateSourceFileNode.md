[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateSourceFileNode

# Variable: ~~updateSourceFileNode()~~

> `const` **updateSourceFileNode**: (`node`, `statements`, `isDeclarationFile?`, `referencedFiles?`, `typeReferences?`, `hasNoDefaultLib?`, `libReferences?`) => [`SourceFile`](../interfaces/SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8149

## Parameters

### node

[`SourceFile`](../interfaces/SourceFile.md)

### statements

readonly [`Statement`](../interfaces/Statement.md)[]

### isDeclarationFile?

`boolean`

### referencedFiles?

readonly [`FileReference`](../interfaces/FileReference.md)[]

### typeReferences?

readonly [`FileReference`](../interfaces/FileReference.md)[]

### hasNoDefaultLib?

`boolean`

### libReferences?

readonly [`FileReference`](../interfaces/FileReference.md)[]

## Returns

[`SourceFile`](../interfaces/SourceFile.md)

## Deprecated

Use `factory.updateSourceFile` or the factory supplied by your transformation context instead.
