[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkArrayRef

# Class: ArkArrayRef

Defined in: src/core/base/Ref.ts:41

## Extends

- [`AbstractRef`](AbstractRef.md)

## Constructors

### Constructor

> **new ArkArrayRef**(`base`, `index`): `ArkArrayRef`

Defined in: src/core/base/Ref.ts:45

#### Parameters

##### base

[`Local`](Local.md)

##### index

[`Value`](../interfaces/Value.md)

#### Returns

`ArkArrayRef`

#### Overrides

[`AbstractRef`](AbstractRef.md).[`constructor`](AbstractRef.md#constructor)

## Methods

### getBase()

> **getBase**(): [`Local`](Local.md)

Defined in: src/core/base/Ref.ts:76

Returns the base of this array reference. Array reference refers to access to array elements.
Array references usually consist of an local variable and an index.
For example, `a[i]` is a typical array reference, where `a` is the base (i.e., local variable)
pointing to the actual memory location where the array is stored
and `i` is the index indicating access to the `i-th` element from array `a`.

#### Returns

[`Local`](Local.md)

the base of this array reference.

#### Example

1. Get the base and the specific elements.

```typescript
// Create an array
let myArray: number[] = [10, 20, 30, 40];
// Create an ArrayRef object representing a reference to myArray[2]
let arrayRef = new ArkArrayRef(myArray, 2);
// Use the getBase() method to get the base of the array
let baseArray = arrayRef.getBase();

console.log("Base array:", baseArray);  // Output: Base array: [10, 20, 30, 40]

// Use baseArray and obeject index of ArrayRef to access to specific array elements
let element = baseArray[arrayRef.index];
console.log("Element at index", arrayRef.index, ":", element);  // Output: Element at index 2 : 30
```

***

### getIndex()

> **getIndex**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Ref.ts:90

Returns the index of this array reference.
In TypeScript, an array reference means that the variable stores
the memory address of the array rather than the actual data of the array.

#### Returns

[`Value`](../interfaces/Value.md)

The index of this array reference.

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Ref.ts:98

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

Defined in: src/core/base/Ref.ts:108

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

### setBase()

> **setBase**(`newBase`): `void`

Defined in: src/core/base/Ref.ts:80

#### Parameters

##### newBase

[`Local`](Local.md)

#### Returns

`void`

***

### setIndex()

> **setIndex**(`newIndex`): `void`

Defined in: src/core/base/Ref.ts:94

#### Parameters

##### newIndex

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Ref.ts:117

Returns a string representation of an object.

#### Returns

`string`
