[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / UnderscoreEscapedMap

# Interface: UnderscoreEscapedMap\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2714

Map where keys are `__String`s.

## Extends

- [`ESMap`](ESMap.md)\<[`__String`](../type-aliases/String.md), `T`\>.[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### size

> `readonly` **size**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:36

#### Inherited from

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`size`](ReadonlyUnderscoreEscapedMap.md#size)

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

[`__String`](../type-aliases/String.md)

#### Returns

`boolean`

#### Inherited from

[`ESMap`](ESMap.md).[`delete`](ESMap.md#delete)

***

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[[`__String`](../type-aliases/String.md), `T`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:49

#### Returns

[`Iterator`](Iterator.md)\<\[[`__String`](../type-aliases/String.md), `T`\]\>

#### Inherited from

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`entries`](ReadonlyUnderscoreEscapedMap.md#entries)

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

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`forEach`](ReadonlyUnderscoreEscapedMap.md#foreach)

***

### get()

> **get**(`key`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:47

#### Parameters

##### key

[`__String`](../type-aliases/String.md)

#### Returns

`undefined` \| `T`

#### Inherited from

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`get`](ReadonlyUnderscoreEscapedMap.md#get)

***

### has()

> **has**(`key`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:37

#### Parameters

##### key

[`__String`](../type-aliases/String.md)

#### Returns

`boolean`

#### Inherited from

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`has`](ReadonlyUnderscoreEscapedMap.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<[`__String`](../type-aliases/String.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<[`__String`](../type-aliases/String.md)\>

#### Inherited from

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`keys`](ReadonlyUnderscoreEscapedMap.md#keys)

***

### set()

> **set**(`key`, `value`): `this`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:59

#### Parameters

##### key

[`__String`](../type-aliases/String.md)

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

[`ReadonlyUnderscoreEscapedMap`](ReadonlyUnderscoreEscapedMap.md).[`values`](ReadonlyUnderscoreEscapedMap.md#values)
