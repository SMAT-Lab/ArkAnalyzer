[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Map

# Interface: Map\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:64

ES6 Map interface.

## Extends

- [`ESMap`](ESMap.md)\<`string`, `T`\>

## Type Parameters

### T

`T`

## Properties

### size

> `readonly` **size**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:36

#### Inherited from

[`ESMap`](ESMap.md).[`size`](ESMap.md#size)

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:43

#### Returns

`void`

#### Inherited from

[`ESMap`](ESMap.md).[`clear`](ESMap.md#clear)

***

### delete()

> **delete**(`key`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:42

#### Parameters

##### key

`string`

#### Returns

`boolean`

#### Inherited from

[`ESMap`](ESMap.md).[`delete`](ESMap.md#delete)

***

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[`string`, `T`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:49

#### Returns

[`Iterator`](Iterator.md)\<\[`string`, `T`\]\>

#### Inherited from

[`ESMap`](ESMap.md).[`entries`](ESMap.md#entries)

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

[`ESMap`](ESMap.md).[`forEach`](ESMap.md#foreach)

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

[`ESMap`](ESMap.md).[`get`](ESMap.md#get)

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

[`ESMap`](ESMap.md).[`has`](ESMap.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<`string`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<`string`\>

#### Inherited from

[`ESMap`](ESMap.md).[`keys`](ESMap.md#keys)

***

### set()

> **set**(`key`, `value`): `this`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:59

#### Parameters

##### key

`string`

##### value

`T`

#### Returns

`this`

#### Inherited from

[`ESMap`](ESMap.md).[`set`](ESMap.md#set)

***

### values()

> **values**(): [`Iterator`](Iterator.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:48

#### Returns

[`Iterator`](Iterator.md)\<`T`\>

#### Inherited from

[`ESMap`](ESMap.md).[`values`](ESMap.md#values)
