[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / GlobalRef

# Class: GlobalRef

Defined in: src/core/base/Ref.ts:316

## Extends

- [`AbstractRef`](AbstractRef.md)

## Constructors

### Constructor

> **new GlobalRef**(`name`, `ref?`): `GlobalRef`

Defined in: src/core/base/Ref.ts:321

#### Parameters

##### name

`string`

##### ref?

[`Value`](../interfaces/Value.md)

#### Returns

`GlobalRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### addUsedStmts()

> **addUsedStmts**(`usedStmts`): `void`

Defined in: src/core/base/Ref.ts:352

#### Parameters

##### usedStmts

[`Stmt`](Stmt.md) | [`Stmt`](Stmt.md)[]

#### Returns

`void`

***

### getName()

> **getName**(): `string`

Defined in: src/core/base/Ref.ts:328

#### Returns

`string`

***

### getRef()

> **getRef**(): `null` \| [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Ref.ts:340

#### Returns

`null` \| [`Value`](../interfaces/Value.md)

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:336

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

[`AbstractRef`](AbstractRef.md).[`getType`](AbstractRef.md#gettype)

***

### getUsedStmts()

> **getUsedStmts**(): [`Stmt`](Stmt.md)[]

Defined in: src/core/base/Ref.ts:348

#### Returns

[`Stmt`](Stmt.md)[]

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Ref.ts:332

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractRef`](AbstractRef.md).[`getUses`](AbstractRef.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): [`AbstractRef`](AbstractRef.md)

Defined in: src/core/base/Ref.ts:36

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractRef`](AbstractRef.md)

#### Inherited from

[`AbstractRef`](AbstractRef.md).[`inferType`](AbstractRef.md#infertype)

***

### setRef()

> **setRef**(`value`): `void`

Defined in: src/core/base/Ref.ts:344

#### Parameters

##### value

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Ref.ts:360

Returns a string representation of an object.

#### Returns

`string`
