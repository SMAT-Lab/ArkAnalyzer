[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkInstanceFieldRef

# Class: ArkInstanceFieldRef

Defined in: src/core/base/Ref.ts:169

## Extends

- [`AbstractFieldRef`](AbstractFieldRef.md)

## Constructors

### Constructor

> **new ArkInstanceFieldRef**(`base`, `fieldSignature`): `ArkInstanceFieldRef`

Defined in: src/core/base/Ref.ts:172

#### Parameters

##### base

[`Local`](Local.md)

##### fieldSignature

[`FieldSignature`](FieldSignature.md)

#### Returns

`ArkInstanceFieldRef`

#### Overrides

[`AbstractFieldRef`](AbstractFieldRef.md).[`constructor`](AbstractFieldRef.md#constructor)

## Methods

### getBase()

> **getBase**(): [`Local`](Local.md)

Defined in: src/core/base/Ref.ts:197

Returns the local of field, showing which object this field belongs to.
A [Local](Local.md) consists of :
- Name: the **string** name of local value, e.g., "$temp0".
- Type: the type of value.

#### Returns

[`Local`](Local.md)

The object that the field belongs to.

#### Example

1. Get a base.

```typescript
if (expr instanceof ArkInstanceFieldRef) {
...
let base = expr.getBase();
if (base.getName() == 'this') {
...
}
...
}
```

***

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

Defined in: src/core/base/Ref.ts:205

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

Defined in: src/core/base/Ref.ts:216

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractRef`](AbstractRef.md)

#### Overrides

[`AbstractFieldRef`](AbstractFieldRef.md).[`inferType`](AbstractFieldRef.md#infertype)

***

### setBase()

> **setBase**(`newBase`): `void`

Defined in: src/core/base/Ref.ts:201

#### Parameters

##### newBase

[`Local`](Local.md)

#### Returns

`void`

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

Defined in: src/core/base/Ref.ts:212

Returns a string representation of an object.

#### Returns

`string`
