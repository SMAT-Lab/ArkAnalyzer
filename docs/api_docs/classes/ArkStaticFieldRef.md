[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkStaticFieldRef

# Class: ArkStaticFieldRef

Defined in: src/core/base/Ref.ts:221

## Extends

- [`AbstractFieldRef`](AbstractFieldRef.md)

## Constructors

### Constructor

> **new ArkStaticFieldRef**(`fieldSignature`): `ArkStaticFieldRef`

Defined in: src/core/base/Ref.ts:222

#### Parameters

##### fieldSignature

[`FieldSignature`](FieldSignature.md)

#### Returns

`ArkStaticFieldRef`

#### Overrides

[`AbstractFieldRef`](AbstractFieldRef.md).[`constructor`](AbstractFieldRef.md#constructor)

## Methods

### getFieldName()

> **getFieldName**(): `string`

Defined in: src/core/base/Ref.ts:134

Returns the the field name as a **string**.

#### Returns

`string`

The the field name.

#### Inherited from

[`AbstractFieldRef`](AbstractFieldRef.md).[`getFieldName`](AbstractFieldRef.md#getfieldname)

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

#### Inherited from

[`AbstractFieldRef`](AbstractFieldRef.md).[`getFieldSignature`](AbstractFieldRef.md#getfieldsignature)

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

#### Inherited from

[`AbstractFieldRef`](AbstractFieldRef.md).[`getType`](AbstractFieldRef.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Ref.ts:226

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Overrides

[`AbstractFieldRef`](AbstractFieldRef.md).[`getUses`](AbstractFieldRef.md#getuses)

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

[`AbstractFieldRef`](AbstractFieldRef.md).[`inferType`](AbstractFieldRef.md#infertype)

***

### setFieldSignature()

> **setFieldSignature**(`newFieldSignature`): `void`

Defined in: src/core/base/Ref.ts:160

#### Parameters

##### newFieldSignature

[`FieldSignature`](FieldSignature.md)

#### Returns

`void`

#### Inherited from

[`AbstractFieldRef`](AbstractFieldRef.md).[`setFieldSignature`](AbstractFieldRef.md#setfieldsignature)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Ref.ts:230

Returns a string representation of an object.

#### Returns

`string`
