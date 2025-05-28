[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkPhiExpr

# Class: ArkPhiExpr

Defined in: src/core/base/Expr.ts:907

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Constructors

### Constructor

> **new ArkPhiExpr**(): `ArkPhiExpr`

Defined in: src/core/base/Expr.ts:911

#### Returns

`ArkPhiExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Methods

### getArgs()

> **getArgs**(): [`Local`](Local.md)[]

Defined in: src/core/base/Expr.ts:923

#### Returns

[`Local`](Local.md)[]

***

### getArgToBlock()

> **getArgToBlock**(): `Map`\<[`Local`](Local.md), [`BasicBlock`](BasicBlock.md)\>

Defined in: src/core/base/Expr.ts:931

#### Returns

`Map`\<[`Local`](Local.md), [`BasicBlock`](BasicBlock.md)\>

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:939

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

Defined in: src/core/base/Expr.ts:917

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

### setArgs()

> **setArgs**(`args`): `void`

Defined in: src/core/base/Expr.ts:927

#### Parameters

##### args

[`Local`](Local.md)[]

#### Returns

`void`

***

### setArgToBlock()

> **setArgToBlock**(`argToBlock`): `void`

Defined in: src/core/base/Expr.ts:935

#### Parameters

##### argToBlock

`Map`\<[`Local`](Local.md), [`BasicBlock`](BasicBlock.md)\>

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:943

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)
