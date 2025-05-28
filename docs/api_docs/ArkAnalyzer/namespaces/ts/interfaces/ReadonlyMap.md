[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ReadonlyMap

# Interface: ReadonlyMap\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:55

ES6 Map interface, only read methods included.

## Extends

- [`ReadonlyESMap`](ReadonlyESMap.md)\<`string`, `T`\>

## Type Parameters

### T

`T`

## Properties

### size

> `readonly` **size**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:36

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`size`](ReadonlyESMap.md#size)

## Methods

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[`string`, `T`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:49

#### Returns

[`Iterator`](Iterator.md)\<\[`string`, `T`\]\>

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`entries`](ReadonlyESMap.md#entries)

***

### forEach()

> **forEach**(`action`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:50

#### Parameters

##### action

(`value`, `key`) => `void`

#### Returns

`void`

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`forEach`](ReadonlyESMap.md#foreach)

***

### get()

> **get**(`key`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:47

#### Parameters

##### key

`string`

#### Returns

`undefined` \| `T`

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`get`](ReadonlyESMap.md#get)

***

### has()

> **has**(`key`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:37

#### Parameters

##### key

`string`

#### Returns

`boolean`

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`has`](ReadonlyESMap.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<`string`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<`string`\>

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`keys`](ReadonlyESMap.md#keys)

***

### values()

> **values**(): [`Iterator`](Iterator.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:48

#### Returns

[`Iterator`](Iterator.md)\<`T`\>

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`values`](ReadonlyESMap.md#values)
