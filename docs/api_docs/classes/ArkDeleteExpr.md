[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkDeleteExpr

# Class: ArkDeleteExpr

Defined in: src/core/base/Expr.ts:428

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Constructors

### Constructor

> **new ArkDeleteExpr**(`field`): `ArkDeleteExpr`

Defined in: src/core/base/Expr.ts:431

#### Parameters

##### field

[`AbstractFieldRef`](AbstractFieldRef.md)

#### Returns

`ArkDeleteExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Methods

### getField()

> **getField**(): [`AbstractFieldRef`](AbstractFieldRef.md)

Defined in: src/core/base/Expr.ts:436

#### Returns

[`AbstractFieldRef`](AbstractFieldRef.md)

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:444

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

Defined in: src/core/base/Expr.ts:448

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getUses`](AbstractExpr.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): [`AbstractExpr`](AbstractExpr.md)

Defined in: src/core/base/Expr.ts:57

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractExpr`](AbstractExpr.md)

#### Inherited from

[`AbstractExpr`](AbstractExpr.md).[`inferType`](AbstractExpr.md#infertype)

***

### setField()

> **setField**(`newField`): `void`

Defined in: src/core/base/Expr.ts:440

#### Parameters

##### newField

[`AbstractFieldRef`](AbstractFieldRef.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:455

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)
