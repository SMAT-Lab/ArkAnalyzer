[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / InvalidatedProjectBase

# Interface: InvalidatedProjectBase

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5976

## Extended by

- [`UpdateOutputFileStampsProject`](UpdateOutputFileStampsProject.md)
- [`BuildInvalidedProject`](BuildInvalidedProject.md)
- [`UpdateBundleProject`](UpdateBundleProject.md)

## Properties

### kind

> `readonly` **kind**: [`InvalidatedProjectKind`](../enumerations/InvalidatedProjectKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5977

***

### project

> `readonly` **project**: [`ResolvedConfigFileName`](../type-aliases/ResolvedConfigFileName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5978

## Methods

### done()

> **done**(`cancellationToken?`, `writeFile?`, `customTransformers?`): [`ExitStatus`](../enumerations/ExitStatus.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5982

To dispose this project and ensure that all the necessary actions are taken and state is updated accordingly

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### writeFile?

[`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

##### customTransformers?

[`CustomTransformers`](CustomTransformers.md)

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5983

#### Returns

[`CompilerOptions`](CompilerOptions.md)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5984

#### Returns

`string`
