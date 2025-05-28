[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AbstractBinopExpr

# Class: `abstract` AbstractBinopExpr

Defined in: src/core/base/Expr.ts:579

## Extends

- [`AbstractExpr`](AbstractExpr.md)

## Extended by

- [`ArkConditionExpr`](ArkConditionExpr.md)
- [`ArkNormalBinopExpr`](ArkNormalBinopExpr.md)

## Constructors

### Constructor

> **new AbstractBinopExpr**(`op1`, `op2`, `operator`): `AbstractBinopExpr`

Defined in: src/core/base/Expr.ts:586

#### Parameters

##### op1

[`Value`](../interfaces/Value.md)

##### op2

[`Value`](../interfaces/Value.md)

##### operator

[`BinaryOperator`](../type-aliases/BinaryOperator.md)

#### Returns

`AbstractBinopExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`constructor`](AbstractExpr.md#constructor)

## Properties

### op1

> `protected` **op1**: [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:580

***

### op2

> `protected` **op2**: [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:581

***

### operator

> `protected` **operator**: [`BinaryOperator`](../type-aliases/BinaryOperator.md)

Defined in: src/core/base/Expr.ts:582

***

### type

> `protected` **type**: [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:584

## Methods

### getOp1()

> **getOp1**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:598

Returns the first operand in the binary operation expression.
For example, the first operand in `a + b;` is `a`.

#### Returns

[`Value`](../interfaces/Value.md)

The first operand in the binary operation expression.

***

### getOp2()

> **getOp2**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:611

Returns the second operand in the binary operation expression.
For example, the second operand in `a + b;` is `b`.

#### Returns

[`Value`](../interfaces/Value.md)

The second operand in the binary operation expression.

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

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getType`](AbstractExpr.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Expr.ts:645

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`getUses`](AbstractExpr.md#getuses)

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

***

### inferType()

> **inferType**(`arkMethod`): `AbstractBinopExpr`

Defined in: src/core/base/Expr.ts:735

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`AbstractBinopExpr`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`inferType`](AbstractExpr.md#infertype)

***

### setOp1()

> **setOp1**(`newOp1`): `void`

Defined in: src/core/base/Expr.ts:602

#### Parameters

##### newOp1

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### setOp2()

> **setOp2**(`newOp2`): `void`

Defined in: src/core/base/Expr.ts:615

#### Parameters

##### newOp2

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### setType()

> `protected` **setType**(): `void`

Defined in: src/core/base/Expr.ts:664

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:654

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractExpr`](AbstractExpr.md).[`toString`](AbstractExpr.md#tostring)
