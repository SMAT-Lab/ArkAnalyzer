[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Value

# Interface: Value

Defined in: src/core/base/Value.ts:21

## Methods

### getType()

> **getType**(): [`Type`](../classes/Type.md)

Defined in: src/core/base/Value.ts:48

Return the type of this value. The interface is encapsulated in Value. 
The `Type` is defined in type.ts, such as **Any**, **Unknown**, **TypeParameter**, 
**UnclearReference**, **Primitive**, **Number**, **String**, etc.

#### Returns

[`Type`](../classes/Type.md)

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

***

### getUses()

> **getUses**(): `Value`[]

Defined in: src/core/base/Value.ts:27

Return a list of values which are contained in this Value.
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

`Value`[]

An **array** of values used by this value.
