[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Set

# Interface: Set\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:74

ES6 Set interface.

## Extends

- [`ReadonlySet`](ReadonlySet.md)\<`T`\>.[`Collection`](Collection.md)\<`T`\>

## Type Parameters

### T

`T`

## Properties

### size

> `readonly` **size**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:36

#### Inherited from

[`Collection`](Collection.md).[`size`](Collection.md#size)

## Methods

### add()

> **add**(`value`): `this`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:75

#### Parameters

##### value

`T`

#### Returns

`this`

***

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:43

#### Returns

`void`

#### Inherited from

[`Collection`](Collection.md).[`clear`](Collection.md#clear)

***

### delete()

> **delete**(`value`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:76

#### Parameters

##### value

`T`

#### Returns

`boolean`

#### Overrides

[`Collection`](Collection.md).[`delete`](Collection.md#delete)

***

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[`T`, `T`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:70

#### Returns

[`Iterator`](Iterator.md)\<\[`T`, `T`\]\>

#### Inherited from

[`ReadonlySet`](ReadonlySet.md).[`entries`](ReadonlySet.md#entries)

***

### forEach()

> **forEach**(`action`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:71

#### Parameters

##### action

(`value`, `key`) => `void`

#### Returns

`void`

#### Inherited from

[`ReadonlySet`](ReadonlySet.md).[`forEach`](ReadonlySet.md#foreach)

***

### has()

> **has**(`value`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:68

#### Parameters

##### value

`T`

#### Returns

`boolean`

#### Inherited from

[`Collection`](Collection.md).[`has`](Collection.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<`T`\>

#### Inherited from

[`Collection`](Collection.md).[`keys`](Collection.md#keys)

***

### values()

> **values**(): [`Iterator`](Iterator.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:69

#### Returns

[`Iterator`](Iterator.md)\<`T`\>

#### Inherited from

[`ReadonlySet`](ReadonlySet.md).[`values`](ReadonlySet.md#values)
