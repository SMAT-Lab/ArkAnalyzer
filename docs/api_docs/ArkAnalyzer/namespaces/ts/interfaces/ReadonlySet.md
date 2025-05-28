[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ReadonlySet

# Interface: ReadonlySet\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:67

ES6 Set interface, only read methods included.

## Extends

- [`ReadonlyCollection`](ReadonlyCollection.md)\<`T`\>

## Extended by

- [`Set`](Set.md)

## Type Parameters

### T

`T`

## Properties

### size

> `readonly` **size**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:36

#### Inherited from

[`ReadonlyCollection`](ReadonlyCollection.md).[`size`](ReadonlyCollection.md#size)

## Methods

### entries()

> **entries**(): [`Iterator`](Iterator.md)\<\[`T`, `T`\]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:70

#### Returns

[`Iterator`](Iterator.md)\<\[`T`, `T`\]\>

***

### forEach()

> **forEach**(`action`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:71

#### Parameters

##### action

(`value`, `key`) => `void`

#### Returns

`void`

***

### has()

> **has**(`value`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:68

#### Parameters

##### value

`T`

#### Returns

`boolean`

#### Overrides

[`ReadonlyCollection`](ReadonlyCollection.md).[`has`](ReadonlyCollection.md#has)

***

### keys()

> **keys**(): [`Iterator`](Iterator.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:38

#### Returns

[`Iterator`](Iterator.md)\<`T`\>

#### Inherited from

[`ReadonlyCollection`](ReadonlyCollection.md).[`keys`](ReadonlyCollection.md#keys)

***

### values()

> **values**(): [`Iterator`](Iterator.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:69

#### Returns

[`Iterator`](Iterator.md)\<`T`\>
