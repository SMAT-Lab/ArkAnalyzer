[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ClosureFieldRef

# Class: ClosureFieldRef

Defined in: src/core/base/Ref.ts:365

## Extends

- [`AbstractRef`](AbstractRef.md)

## Constructors

### Constructor

> **new ClosureFieldRef**(`base`, `fieldName`, `type`): `ClosureFieldRef`

Defined in: src/core/base/Ref.ts:370

#### Parameters

##### base

[`Local`](Local.md)

##### fieldName

`string`

##### type

[`Type`](Type.md)

#### Returns

`ClosureFieldRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### getBase()

> **getBase**(): [`Local`](Local.md)

Defined in: src/core/base/Ref.ts:381

#### Returns

[`Local`](Local.md)

***

### getFieldName()

> **getFieldName**(): `string`

Defined in: src/core/base/Ref.ts:389

#### Returns

`string`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:385

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

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Ref.ts:377

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

Defined in: src/core/base/Ref.ts:397

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractRef`](AbstractRef.md)

#### Overrides

[`AbstractRef`](AbstractRef.md).[`inferType`](AbstractRef.md#infertype)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Ref.ts:393

Returns a string representation of an object.

#### Returns

`string`
