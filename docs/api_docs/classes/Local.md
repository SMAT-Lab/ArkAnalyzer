[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Local

# Class: Local

Defined in: src/core/base/Local.ts:32

## Implements

- [`Value`](../interfaces/Value.md)
- `ArkExport`

## Constructors

### Constructor

> **new Local**(`name`, `type`): `Local`

Defined in: src/core/base/Local.ts:43

#### Parameters

##### name

`string`

##### type

[`Type`](Type.md) = `...`

#### Returns

`Local`

## Methods

### addUsedStmt()

> **addUsedStmt**(`usedStmt`): `void`

Defined in: src/core/base/Local.ts:151

#### Parameters

##### usedStmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### containsModifier()

> **containsModifier**(`modifierType`): `boolean`

Defined in: src/core/base/Local.ts:191

#### Parameters

##### modifierType

`ModifierType`

#### Returns

`boolean`

#### Implementation of

`ArkExport.containsModifier`

***

### getConstFlag()

> **getConstFlag**(): `boolean`

Defined in: src/core/base/Local.ts:212

#### Returns

`boolean`

***

### getDeclaringStmt()

> **getDeclaringStmt**(): `null` \| [`Stmt`](Stmt.md)

Defined in: src/core/base/Local.ts:135

Returns the declaring statement, which may also be a **null**.
For example, if the code snippet in a function is `let dd = cc + 5;` where `cc` is a **number**
and `dd` is not defined before, then the declaring statemet of local `dd`:
- its **string** text is "dd = cc + 5".
- the **strings** of right operand and left operand are "cc + 5" and "dd", respectively.
- three values are used in this statement: `cc + 5` (i.e., a normal binary operation expression), `cc` (a local), and `5` (a constant), respectively.

#### Returns

`null` \| [`Stmt`](Stmt.md)

The declaring statement (maybe a **null**) of the local.

#### Example

1. get the statement that defines the local for the first time.

```typescript
let stmt = local.getDeclaringStmt();
if (stmt !== null) {
...
}
```

***

### getExportType()

> **getExportType**(): `ExportType`

Defined in: src/core/base/Local.ts:183

#### Returns

`ExportType`

#### Implementation of

`ArkExport.getExportType`

***

### getModifiers()

> **getModifiers**(): `number`

Defined in: src/core/base/Local.ts:187

#### Returns

`number`

#### Implementation of

`ArkExport.getModifiers`

***

### getName()

> **getName**(): `string`

Defined in: src/core/base/Local.ts:89

Returns the name of local value.

#### Returns

`string`

The name of local value.

#### Example

1. get the name of local value.

```typescript
arkClass.getDefaultArkMethod()?.getBody().getLocals().forEach(local => {
const arkField = new ArkField();
arkField.setFieldType(ArkField.DEFAULT_ARK_Field);
arkField.setDeclaringClass(defaultClass);
arkField.setType(local.getType());
arkField.setName(local.getName());
arkField.genSignature();
defaultClass.addField(arkField);
});
```

#### Implementation of

`ArkExport.getName`

***

### getOriginalValue()

> **getOriginalValue**(): `null` \| [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Local.ts:109

#### Returns

`null` \| [`Value`](../interfaces/Value.md)

***

### getSignature()

> **getSignature**(): [`LocalSignature`](LocalSignature.md)

Defined in: src/core/base/Local.ts:198

#### Returns

[`LocalSignature`](LocalSignature.md)

#### Implementation of

`ArkExport.getSignature`

***

### getType()

> **getType**(): [`Type`](Type.md)

Defined in: src/core/base/Local.ts:101

Returns the type of this local.

#### Returns

[`Type`](Type.md)

The type of this local.

#### Implementation of

[`Value`](../interfaces/Value.md).[`getType`](../interfaces/Value.md#gettype)

***

### getUsedStmts()

> **getUsedStmts**(): [`Stmt`](Stmt.md)[]

Defined in: src/core/base/Local.ts:162

Returns an array of statements used by the local, i.e., the statements in which the local participate.
For example, if the code snippet is `let dd = cc + 5;` where `cc` is a local and `cc` only appears once,
then the length of **array** returned is 1 and `Stmts[0]` will be same as the example described
in the `Local.getDeclaringStmt()`.

#### Returns

[`Stmt`](Stmt.md)[]

An array of statements used by the local.

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Local.ts:147

Returns an **array** of values which are contained in this local.

#### Returns

[`Value`](../interfaces/Value.md)[]

An **array** of values used by this local.

#### Implementation of

[`Value`](../interfaces/Value.md).[`getUses`](../interfaces/Value.md#getuses)

***

### inferType()

> **inferType**(`arkMethod`): `Local`

Defined in: src/core/base/Local.ts:52

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`Local`

***

### setConstFlag()

> **setConstFlag**(`newConstFlag`): `void`

Defined in: src/core/base/Local.ts:219

#### Parameters

##### newConstFlag

`boolean`

#### Returns

`void`

***

### setDeclaringStmt()

> **setDeclaringStmt**(`declaringStmt`): `void`

Defined in: src/core/base/Local.ts:139

#### Parameters

##### declaringStmt

[`Stmt`](Stmt.md)

#### Returns

`void`

***

### setName()

> **setName**(`name`): `void`

Defined in: src/core/base/Local.ts:93

#### Parameters

##### name

`string`

#### Returns

`void`

***

### setOriginalValue()

> **setOriginalValue**(`originalValue`): `void`

Defined in: src/core/base/Local.ts:113

#### Parameters

##### originalValue

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### setSignature()

> **setSignature**(`signature`): `void`

Defined in: src/core/base/Local.ts:208

#### Parameters

##### signature

[`LocalSignature`](LocalSignature.md)

#### Returns

`void`

***

### setType()

> **setType**(`newType`): `void`

Defined in: src/core/base/Local.ts:105

#### Parameters

##### newType

[`Type`](Type.md)

#### Returns

`void`

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Local.ts:179

Get a string of local name in Local

#### Returns

`string`

The string of local name.

#### Example

1. get a name string.

```typescript
for (const value of stmt.getUses()) {
const name = value.toString();
...
}
```
