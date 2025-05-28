[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkStaticInvokeExpr

# Class: ArkStaticInvokeExpr

Defined in: src/core/base/Expr.ts:223

## Extends

- [`AbstractInvokeExpr`](AbstractInvokeExpr.md)

## Constructors

### Constructor

> **new ArkStaticInvokeExpr**(`methodSignature`, `args`, `realGenericTypes?`): `ArkStaticInvokeExpr`

Defined in: src/core/base/Expr.ts:224

#### Parameters

##### methodSignature

[`MethodSignature`](MethodSignature.md)

##### args

[`Value`](../interfaces/Value.md)[]

##### realGenericTypes?

[`Type`](Type.md)[]

#### Returns

`ArkStaticInvokeExpr`

#### Overrides

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`constructor`](AbstractInvokeExpr.md#constructor)

## Methods

### getArg()

> **getArg**(`index`): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Expr.ts:101

Returns an argument used in the expression according to its index.

#### Parameters

##### index

`number`

the index of the argument.

#### Returns

[`Value`](../interfaces/Value.md)

An argument used in the expression.

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`getArg`](AbstractInvokeExpr.md#getarg)

***

### getArgs()

> **getArgs**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Expr.ts:127

Returns an **array** of arguments used in the expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of arguments used in the expression.

#### Example

1. get args number.

```typescript
const argsNum = expr.getArgs().length;
if (argsNum < 5) {
... ...
}
```

2. iterate arg based on expression

```typescript
for (const arg of this.getArgs()) {
strs.push(arg.toString());
strs.push(', ');
}
```

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`getArgs`](AbstractInvokeExpr.md#getargs)

***

### getMethodSignature()

> **getMethodSignature**(): [`MethodSignature`](MethodSignature.md)

Defined in: src/core/base/Expr.ts:88

Get method Signature. The method signature is consist of ClassSignature and MethodSubSignature.
It is the unique flag of a method. It is usually used to compose a expression string in ArkIRTransformer.

#### Returns

[`MethodSignature`](MethodSignature.md)

The class method signature, such as ArkStaticInvokeExpr.

#### Example

1. 3AC information composed of getMethodSignature ().

```typescript
let strs: string[] = [];
strs.push('staticinvoke <');
strs.push(this.getMethodSignature().toString());
strs.push('>(');
```

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`getMethodSignature`](AbstractInvokeExpr.md#getmethodsignature)

***

### getRealGenericTypes()

> **getRealGenericTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/base/Expr.ts:143

#### Returns

`undefined` \| [`Type`](Type.md)[]

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`getRealGenericTypes`](AbstractInvokeExpr.md#getrealgenerictypes)

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Expr.ts:135

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

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`getType`](AbstractInvokeExpr.md#gettype)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Expr.ts:153

Return a list of values which are contained in this [Value](../interfaces/Value.md).
Value is a core interface in ArkAnalyzer, which may represent any value or expression.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this value.

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`getUses`](AbstractInvokeExpr.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): [`AbstractInvokeExpr`](AbstractInvokeExpr.md)

Defined in: src/core/base/Expr.ts:244

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

[`AbstractInvokeExpr`](AbstractInvokeExpr.md)

#### Overrides

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`inferType`](AbstractInvokeExpr.md#infertype)

***

### setArgs()

> **setArgs**(`newArgs`): `void`

Defined in: src/core/base/Expr.ts:131

#### Parameters

##### newArgs

[`Value`](../interfaces/Value.md)[]

#### Returns

`void`

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`setArgs`](AbstractInvokeExpr.md#setargs)

***

### setMethodSignature()

> **setMethodSignature**(`newMethodSignature`): `void`

Defined in: src/core/base/Expr.ts:92

#### Parameters

##### newMethodSignature

[`MethodSignature`](MethodSignature.md)

#### Returns

`void`

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`setMethodSignature`](AbstractInvokeExpr.md#setmethodsignature)

***

### setRealGenericTypes()

> **setRealGenericTypes**(`realTypes`): `void`

Defined in: src/core/base/Expr.ts:147

#### Parameters

##### realTypes

`undefined` | [`Type`](Type.md)[]

#### Returns

`void`

#### Inherited from

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`setRealGenericTypes`](AbstractInvokeExpr.md#setrealgenerictypes)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Expr.ts:228

Returns a string representation of an object.

#### Returns

`string`

#### Overrides

[`AbstractInvokeExpr`](AbstractInvokeExpr.md).[`toString`](AbstractInvokeExpr.md#tostring)
