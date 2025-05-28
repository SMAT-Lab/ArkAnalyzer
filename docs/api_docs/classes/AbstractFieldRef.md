[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / AbstractFieldRef

# Class: `abstract` AbstractFieldRef

Defined in: src/core/base/Ref.ts:122

## Extends

- [`AbstractRef`](AbstractRef.md)

## Extended by

- [`ArkInstanceFieldRef`](ArkInstanceFieldRef.md)
- [`ArkStaticFieldRef`](ArkStaticFieldRef.md)

## Constructors

### Constructor

> **new AbstractFieldRef**(`fieldSignature`): `AbstractFieldRef`

Defined in: src/core/base/Ref.ts:125

#### Parameters

##### fieldSignature

[`FieldSignature`](FieldSignature.md)

#### Returns

`AbstractFieldRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### getFieldName()

> **getFieldName**(): `string`

Defined in: src/core/base/Ref.ts:134

Returns the the field name as a **string**.

#### Returns

`string`

The the field name.

***

### getFieldSignature()

> **getFieldSignature**(): [`FieldSignature`](FieldSignature.md)

Defined in: src/core/base/Ref.ts:156

Returns a field signature, which consists of a class signature,
a **string** field name, and a **boolean** label indicating whether it is static or not.

#### Returns

[`FieldSignature`](FieldSignature.md)

The field signature.

#### Example

1. Compare two Fields

```typescript
const fieldSignature = new FieldSignature();
fieldSignature.setFieldName(...);
const fieldRef = new ArkInstanceFieldRef(baseValue as Local, fieldSignature);
...
if (fieldRef.getFieldSignature().getFieldName() ===
targetField.getFieldSignature().getFieldName()) {
...
}
```

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:164

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

> `abstract` **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Ref.ts:32

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Inherited from

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

### setFieldSignature()

> **setFieldSignature**(`newFieldSignature`): `void`

Defined in: src/core/base/Ref.ts:160

#### Parameters

##### newFieldSignature

[`FieldSignature`](FieldSignature.md)

#### Returns

`void`
