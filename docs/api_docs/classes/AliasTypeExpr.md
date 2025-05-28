[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AliasTypeExpr

# Class: AliasTypeExpr

Defined in: src/core/base/Expr.ts:1026

Expression of the right hand of the type alias definition statement.

## Example

```typescript
let a: number = 123;
type ABC = typeof a;
```
The AliasTypeExpr of the previous statement is with local 'a' as the 'originalObject' and 'transferWithTypeOf' is true.

The Following case: import type with no clause name is not supported now,
whose 'originalObject' is [ImportInfo](ImportInfo.md) with 'null' 'lazyExportInfo'.
```typescript
let a = typeof import('./abc');
```

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Constructors

### Constructor

> **new AliasTypeExpr**(`originalObject`, `transferWithTypeOf?`): `AliasTypeExpr`

Defined in: src/core/base/Expr.ts:1031

#### Parameters

##### originalObject

[`AliasTypeOriginalModel`](../type-aliases/AliasTypeOriginalModel.md)

##### transferWithTypeOf?

`boolean`

#### Returns

`AliasTypeExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Methods

### getOriginalObject()

> **getOriginalObject**(): [`AliasTypeOriginalModel`](../type-aliases/AliasTypeOriginalModel.md)

Defined in: src/core/base/Expr.ts:1039

#### Returns

[`AliasTypeOriginalModel`](../type-aliases/AliasTypeOriginalModel.md)

***

### getRealGenericTypes()

> **getRealGenericTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/base/Expr.ts:1055

#### Returns

`undefined` \| [`Type`](Type.md)[]

***

### getTransferWithTypeOf()

> **getTransferWithTypeOf**(): `boolean`

Defined in: src/core/base/Expr.ts:1047

#### Returns

`boolean`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:1059

Return the type of this value. The interface is encapsulated in [Value](../interfaces/Value.md). 
The `Type` is defined in type.ts, such as **Any**, **Unknown**, **TypeParameter**, 
**UnclearReference**, **Primitive**, **Number**, **String**, etc.

#### Returns

[`Type`](Type.md)

The type of this value.

#### Example

1. In the declaration statement, determine the left-value type and right-value type.

```typescript
let leftValue:Value;
let rightValue:Value;
...
if (leftValue.getType() instanceof UnknownType && 
   !(rightValue.getType() instanceof UnknownType) &&
   !(rightValue.getType() instanceof UndefinedType)) {
   ...
}
```

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getType`](AbstractExpr.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Expr.ts:1109

Returns all used values which mainly used for def-use chain analysis.

#### Returns

[`Value`](../interfaces/Value.md)[]

Always returns empty array because her is the alias type definition which has no relationship with value flow.

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getUses`](AbstractExpr.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): [`AbstractExpr`](AbstractExpr.md)

Defined in: src/core/base/Expr.ts:1101

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractExpr`](AbstractExpr.md)

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`inferType`](AbstractExpr.md#infertype)

***

### setOriginalObject()

> **setOriginalObject**(`object`): `void`

Defined in: src/core/base/Expr.ts:1043

#### Parameters

##### object

[`AliasTypeOriginalModel`](../type-aliases/AliasTypeOriginalModel.md)

#### Returns

`void`

***

### setRealGenericTypes()

> **setRealGenericTypes**(`realGenericTypes`): `void`

Defined in: src/core/base/Expr.ts:1051

#### Parameters

##### realGenericTypes

[`Type`](Type.md)[]

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:1113

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)

***

### isAliasTypeOriginalModel()

> `static` **isAliasTypeOriginalModel**(`object`): `object is AliasTypeOriginalModel`

Defined in: src/core/base/Expr.ts:1149

#### Parameters

##### object

`any`

#### Returns

`object is AliasTypeOriginalModel`
