[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ReadonlyESMap

# Interface: ReadonlyESMap\<K, V\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:46

ES6 Map interface, only read methods included.

## Extends

- [`ReadonlyCollection`](ReadonlyCollection.md)\<`K`\>

## Extended by

- [`ReadonlyMap`](ReadonlyMap.md)
- [`ESMap`](ESMap.md)
- [`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md)

## Type Parameters

### K

`K`

### V

`V`

## Properties

### size

> `readonly` **size**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:36

#### Inherited from

[`ReadonlyCollection`](ReadonlyCollection.md).[`size`](ReadonlyCollection.md#size)

## Methods

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[`K`, `V`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:49

#### Returns

[`Iterator`](Iterator.md)\<\[`K`, `V`\]\>

***

### forEach()

> **forEach**(`action`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:50

#### Parameters

##### action

(`value`, `key`) => `void`

#### Returns

`void`

***

### get()

> **get**(`key`): `undefined` \| `V`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:47

#### Parameters

##### key

`K`

#### Returns

`undefined` \| `V`

***

### has()

> **has**(`key`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:37

#### Parameters

##### key

`K`

#### Returns

`boolean`

#### Inherited from

[`ReadonlyCollection`](ReadonlyCollection.md).[`has`](ReadonlyCollection.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<`K`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<`K`\>

#### Inherited from

[`ReadonlyCollection`](ReadonlyCollection.md).[`keys`](ReadonlyCollection.md#keys)

***

### values()

> **values**(): [`Iterator`](Iterator.md)\<`V`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:48

#### Returns

[`Iterator`](Iterator.md)\<`V`\>
