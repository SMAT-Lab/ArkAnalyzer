[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SolutionBuilder

# Interface: SolutionBuilder\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5956

## Type Parameters

### T

`T` *extends* [`BuilderProgram`](BuilderProgram.md)

## Methods

### build()

> **build**(`project?`, `cancellationToken?`, `writeFile?`, `getCustomTransformers?`): [`ExitStatus`](../enumerations/ExitStatus.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5957

#### Parameters

##### project?

`string`

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### writeFile?

[`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

##### getCustomTransformers?

(`project`) => [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

***

### buildReferences()

> **buildReferences**(`project`, `cancellationToken?`, `writeFile?`, `getCustomTransformers?`): [`ExitStatus`](../enumerations/ExitStatus.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5959

#### Parameters

##### project

`string`

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

##### writeFile?

[`WriteFileCallback`](../type-aliases/WriteFileCallback.md)

##### getCustomTransformers?

(`project`) => [`CustomTransformers`](CustomTransformers.md)

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

***

### clean()

> **clean**(`project?`): [`ExitStatus`](../enumerations/ExitStatus.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5958

#### Parameters

##### project?

`string`

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

***

### cleanReferences()

> **cleanReferences**(`project?`): [`ExitStatus`](../enumerations/ExitStatus.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5960

#### Parameters

##### project?

`string`

#### Returns

[`ExitStatus`](../enumerations/ExitStatus.md)

***

### getNextInvalidatedProject()

> **getNextInvalidatedProject**(`cancellationToken?`): `undefined` \| [`InvalidatedProject`](../type-aliases/InvalidatedProject.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5961

#### Parameters

##### cancellationToken?

[`CancellationToken`](CancellationToken.md)

#### Returns

`undefined` \| [`InvalidatedProject`](../type-aliases/InvalidatedProject.md)\<`T`\>
