[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkParameterRef

# Class: ArkParameterRef

Defined in: src/core/base/Ref.ts:235

## Extends

- [`AbstractRef`](AbstractRef.md)

## Constructors

### Constructor

> **new ArkParameterRef**(`index`, `paramType`): `ArkParameterRef`

Defined in: src/core/base/Ref.ts:239

#### Parameters

##### index

`number`

##### paramType

[`Type`](Type.md)

#### Returns

`ArkParameterRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### getIndex()

> **getIndex**(): `number`

Defined in: src/core/base/Ref.ts:245

#### Returns

`number`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:253

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

Defined in: src/core/base/Ref.ts:265

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

Defined in: src/core/base/Ref.ts:261

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractRef`](AbstractRef.md)

#### Overrides

[`AbstractRef`](AbstractRef.md).[`inferType`](AbstractRef.md#infertype)

***

### setIndex()

> **setIndex**(`index`): `void`

Defined in: src/core/base/Ref.ts:249

#### Parameters

##### index

`number`

#### Returns

`void`

***

### setType()

> **setType**(`newType`): `void`

Defined in: src/core/base/Ref.ts:257

#### Parameters

##### newType

[`Type`](Type.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Ref.ts:269

Returns a string representation of an object.

#### Returns

`string`
