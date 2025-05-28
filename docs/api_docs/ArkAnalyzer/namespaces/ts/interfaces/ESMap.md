[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ESMap

# Interface: ESMap\<K, V\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:58

ES6 Map interface.

## Extends

- [`ReadonlyESMap`](ReadonlyESMap.md)\<`K`, `V`\>.[`Collection`](Collection.md)\<`K`\>

## Extended by

- [`Map`](Map.md)
- [`UnderscoreEscapedMap`](UnderscoreEscapedMap.md)

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

[`Collection`](Collection.md).[`size`](Collection.md#size)

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:43

#### Returns

`void`

#### Inherited from

[`Collection`](Collection.md).[`clear`](Collection.md#clear)

***

### delete()

> **delete**(`key`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:42

#### Parameters

##### key

`K`

#### Returns

`boolean`

#### Inherited from

[`Collection`](Collection.md).[`delete`](Collection.md#delete)

***

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[`K`, `V`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:49

#### Returns

[`Iterator`](Iterator.md)\<\[`K`, `V`\]\>

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

> **get**(`key`): `undefined` \| `V`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:47

#### Parameters

##### key

`K`

#### Returns

`undefined` \| `V`

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`get`](ReadonlyESMap.md#get)

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

[`Collection`](Collection.md).[`has`](Collection.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<`K`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<`K`\>

#### Inherited from

[`Collection`](Collection.md).[`keys`](Collection.md#keys)

***

### set()

> **set**(`key`, `value`): `this`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:59

#### Parameters

##### key

`K`

##### value

`V`

#### Returns

`this`

***

### values()

> **values**(): [`Iterator`](Iterator.md)\<`V`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:48

#### Returns

[`Iterator`](Iterator.md)\<`V`\>

#### Inherited from

[`ReadonlyESMap`](ReadonlyESMap.md).[`values`](ReadonlyESMap.md#values)
