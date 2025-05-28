[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / UpdateOutputFileStampsProject

# Interface: UpdateOutputFileStampsProject

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5986

## Extends

- [`InvalidatedProjectBase`](InvalidatedProjectBase.md)

## Properties

### kind

> `readonly` **kind**: [`UpdateOutputFileStamps`](../enumerations/InvalidatedProjectKind.md#updateoutputfilestamps)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5987

#### Overrides

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`kind`](InvalidatedProjectBase.md#kind)

***

### project

> `readonly` **project**: [`ResolvedConfigFileName`](../type-aliases/ResolvedConfigFileName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5978

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`project`](InvalidatedProjectBase.md#project)

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

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`done`](InvalidatedProjectBase.md#done)

***

### getCompilerOptions()

> **getCompilerOptions**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5983

#### Returns

[`CompilerOptions`](CompilerOptions.md)

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCompilerOptions`](InvalidatedProjectBase.md#getcompileroptions)

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5984

#### Returns

`string`

#### Inherited from

[`InvalidatedProjectBase`](InvalidatedProjectBase.md).[`getCurrentDirectory`](InvalidatedProjectBase.md#getcurrentdirectory)

***

### updateOutputFileStatmps()

> **updateOutputFileStatmps**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5988

#### Returns

`void`
