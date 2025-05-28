[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ModeAwareCache

# Interface: ModeAwareCache\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5364

## Type Parameters

### T

`T`

## Methods

### delete()

> **delete**(`key`, `mode`): `this`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5367

#### Parameters

##### key

`string`

##### mode

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

#### Returns

`this`

***

### forEach()

> **forEach**(`cb`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5369

#### Parameters

##### cb

(`elem`, `key`, `mode`) => `void`

#### Returns

`void`

***

### get()

> **get**(`key`, `mode`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5365

#### Parameters

##### key

`string`

##### mode

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

#### Returns

`undefined` \| `T`

***

### has()

> **has**(`key`, `mode`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5368

#### Parameters

##### key

`string`

##### mode

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

#### Returns

`boolean`

***

### set()

> **set**(`key`, `mode`, `value`): `this`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5366

#### Parameters

##### key

`string`

##### mode

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

##### value

`T`

#### Returns

`this`

***

### size()

> **size**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5370

#### Returns

`number`
