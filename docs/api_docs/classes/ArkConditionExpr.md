[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkConditionExpr

# Class: ArkConditionExpr

Defined in: src/core/base/Expr.ts:743

## Extends

- [`AbstractBinopExpr`](AbstractBinopExpr.md)

## Constructors

### Constructor

> **new ArkConditionExpr**(`op1`, `op2`, `operator`): `ArkConditionExpr`

Defined in: src/core/base/Expr.ts:744

#### Parameters

##### op1

[`Value`](../interfaces/Value.md)

##### op2

[`Value`](../interfaces/Value.md)

##### operator

[`RelationalBinaryOperator`](../enumerations/RelationalBinaryOperator.md)

#### Returns

`ArkConditionExpr`

#### Overrides

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`constructor`](AbstractBinopExpr.md#constructor)

## Properties

### op1

> `protected` **op1**: [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:580

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`op1`](AbstractBinopExpr.md#op1)

***

### op2

> `protected` **op2**: [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:581

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`op2`](AbstractBinopExpr.md#op2)

***

### operator

> `protected` **operator**: [`BinaryOperator`](../type-aliases/BinaryOperator.md)

Defined in: src/core/base/Expr.ts:582

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`operator`](AbstractBinopExpr.md#operator)

***

### type

> `protected` **type**: [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:584

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`type`](AbstractBinopExpr.md#type)

## Methods

### getOp1()

> **getOp1**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:598

Returns the first operand in the binary operation expression.
For example, the first operand in `a + b;` is `a`.

#### Returns

[`Value`](../interfaces/Value.md)

The first operand in the binary operation expression.

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`getOp1`](AbstractBinopExpr.md#getop1)

***

### getOp2()

> **getOp2**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:611

Returns the second operand in the binary operation expression.
For example, the second operand in `a + b;` is `b`.

#### Returns

[`Value`](../interfaces/Value.md)

The second operand in the binary operation expression.

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`getOp2`](AbstractBinopExpr.md#getop2)

***

### getOperator()

> **getOperator**(): [`BinaryOperator`](../type-aliases/BinaryOperator.md)

Defined in: src/core/base/Expr.ts:634

Get the binary operator from the statement.
The binary operator can be divided into two categories,
one is the normal binary operator and the other is relational binary operator.

#### Returns

[`BinaryOperator`](../type-aliases/BinaryOperator.md)

The binary operator from the statement.

#### Example

```typescript
if (expr instanceof AbstractBinopExpr) {
let op1: Value = expr.getOp1();
let op2: Value = expr.getOp2();
let operator: string = expr.getOperator();
... ...
}
```

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`getOperator`](AbstractBinopExpr.md#getoperator)

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:638

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

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`getType`](AbstractBinopExpr.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Expr.ts:645

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`getUses`](AbstractBinopExpr.md#getuses)

***

### inferOpType()

> `protected` **inferOpType**(`op`, `arkMethod`): `void`

Defined in: src/core/base/Expr.ts:658

#### Parameters

##### op

[`Value`](../interfaces/Value.md)

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`inferOpType`](AbstractBinopExpr.md#inferoptype)

***

### inferType()

> **inferType**(`arkMethod`): `ArkConditionExpr`

Defined in: src/core/base/Expr.ts:748

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`ArkConditionExpr`

#### Overrides

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`inferType`](AbstractBinopExpr.md#infertype)

***

### setOp1()

> **setOp1**(`newOp1`): `void`

Defined in: src/core/base/Expr.ts:602

#### Parameters

##### newOp1

[`Value`](../interfaces/Value.md)

#### Returns

`void`

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`setOp1`](AbstractBinopExpr.md#setop1)

***

### setOp2()

> **setOp2**(`newOp2`): `void`

Defined in: src/core/base/Expr.ts:615

#### Parameters

##### newOp2

[`Value`](../interfaces/Value.md)

#### Returns

`void`

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`setOp2`](AbstractBinopExpr.md#setop2)

***

### setType()

> `protected` **setType**(): `void`

Defined in: src/core/base/Expr.ts:664

#### Returns

`void`

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`setType`](AbstractBinopExpr.md#settype)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:654

Returns a string representation of an object.

#### Returns

`string`

#### Inherited from

[`AbstractBinopExpr`](AbstractBinopExpr.md).[`toString`](AbstractBinopExpr.md#tostring)
