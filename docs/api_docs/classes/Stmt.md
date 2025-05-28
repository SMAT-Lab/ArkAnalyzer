[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Stmt

# Class: `abstract` Stmt

Defined in: src/core/base/Stmt.ts:32

## Extended by

- [`ArkAssignStmt`](ArkAssignStmt.md)
- [`ArkInvokeStmt`](ArkInvokeStmt.md)
- [`ArkIfStmt`](ArkIfStmt.md)
- [`ArkReturnStmt`](ArkReturnStmt.md)
- [`ArkReturnVoidStmt`](ArkReturnVoidStmt.md)
- [`ArkThrowStmt`](ArkThrowStmt.md)
- [`ArkAliasTypeDefineStmt`](ArkAliasTypeDefineStmt.md)

## Constructors

### Constructor

> **new Stmt**(): `Stmt`

#### Returns

`Stmt`

## Properties

### cfg

> `protected` **cfg**: [`Cfg`](Cfg.md)

Defined in: src/core/base/Stmt.ts:36

***

### metadata?

> `optional` **metadata**: `ArkMetadata`

Defined in: src/core/base/Stmt.ts:39

***

### operandOriginalPositions?

> `protected` `optional` **operandOriginalPositions**: [`FullPosition`](FullPosition.md)[]

Defined in: src/core/base/Stmt.ts:37

***

### originalPosition

> `protected` **originalPosition**: [`LineColPosition`](LineColPosition.md) = `LineColPosition.DEFAULT`

Defined in: src/core/base/Stmt.ts:35

***

### originalText?

> `protected` `optional` **originalText**: `string`

Defined in: src/core/base/Stmt.ts:34

***

### text?

> `protected` `optional` **text**: `string`

Defined in: src/core/base/Stmt.ts:33

## Methods

### containsArrayRef()

> **containsArrayRef**(): `boolean`

Defined in: src/core/base/Stmt.ts:199

#### Returns

`boolean`

***

### containsFieldRef()

> **containsFieldRef**(): `boolean`

Defined in: src/core/base/Stmt.ts:225

#### Returns

`boolean`

***

### containsInvokeExpr()

> **containsInvokeExpr**(): `boolean`

Defined in: src/core/base/Stmt.ts:137

#### Returns

`boolean`

***

### getArrayRef()

> **getArrayRef**(): `undefined` \| [`ArkArrayRef`](ArkArrayRef.md)

Defined in: src/core/base/Stmt.ts:211

#### Returns

`undefined` \| [`ArkArrayRef`](ArkArrayRef.md)

***

### getCfg()

> **getCfg**(): [`Cfg`](Cfg.md)

Defined in: src/core/base/Stmt.ts:116

Get the CFG (i.e., control flow graph) of an [ArkBody](ArkBody.md) in which the statement is.
A CFG contains a set of basic blocks and statements corresponding to each basic block.
Note that, "source code" and "three-address" are two types of Stmt in ArkAnalyzer.
Source code Stmt represents the statement of ets/ts source code, while three-address code Stmt
represents the statement after it has been converted into three-address code.  Since the source code Stmt does not save its CFG reference, it returns **null**, while the `getCfg()` of the third address code
Stmt will return its CFG reference.

#### Returns

[`Cfg`](Cfg.md)

The CFG (i.e., control flow graph) of an [ArkBody](ArkBody.md) in which the statement is.

#### Example

1. get the ArkFile based on stmt.
```typescript
const arkFile = stmt.getCfg()?.getDeclaringMethod().getDeclaringArkFile();
```
2. get the ArkMethod based on stmt.
```typescript
let sourceMethod: ArkMethod = stmt.getCfg()?.getDeclaringMethod();
```

***

### getDef()

> **getDef**(): `null` \| [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Stmt.ts:78

Return the definition which is uesd in this statement. Generally, the definition is the left value of `=` in
3AC.  For example, the definition in 3AC of `value = parameter0: @project-1/sample-1.ets: AnonymousClass-0` is
`value`,  and the definition in `$temp0 = staticinvoke <@_ProjectName/_FileName: xxx.create()>()` is `\$temp0`.

#### Returns

`null` \| [`Value`](../interfaces/Value.md)

The definition in 3AC (may be a **null**).

#### Example

1. get the def in stmt.
```typescript
for (const block of this.blocks) {
for (const stmt of block.getStmts()) {
   const defValue = stmt.getDef();
   ...
   }
}
```

***

### getDefAndUses()

> **getDefAndUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Stmt.ts:87

#### Returns

[`Value`](../interfaces/Value.md)[]

***

### getExpectedSuccessorCount()

> **getExpectedSuccessorCount**(): `number`

Defined in: src/core/base/Stmt.ts:133

Return the number of statements which this statement may go to

#### Returns

`number`

***

### getExprs()

> **getExprs**(): [`AbstractExpr`](AbstractExpr.md)[]

Defined in: src/core/base/Stmt.ts:178

Returns an array of expressions in the statement.

#### Returns

[`AbstractExpr`](AbstractExpr.md)[]

An array of expressions in the statement.

#### Example

1. Traverse expression of statement.

```typescript
for (const expr of stmt.getExprs()) {
   ...
}
```

***

### getFieldRef()

> **getFieldRef**(): `undefined` \| [`AbstractFieldRef`](AbstractFieldRef.md)

Defined in: src/core/base/Stmt.ts:238

#### Returns

`undefined` \| [`AbstractFieldRef`](AbstractFieldRef.md)

***

### getInvokeExpr()

> **getInvokeExpr**(): `undefined` \| [`AbstractInvokeExpr`](AbstractInvokeExpr.md)

Defined in: src/core/base/Stmt.ts:157

Returns the method's invocation expression (including method signature and its arguments) 
in the current statement. An **undefined** will be returned if there is no method used in this statement.

#### Returns

`undefined` \| [`AbstractInvokeExpr`](AbstractInvokeExpr.md)

the method's invocation expression from the statement. An **undefined** will be returned if there is
    no method can be found in this statement.

#### Example

1. get invoke expr based on stmt.
```typescript
let invoke = stmt.getInvokeExpr();
```

***

### getMetadata()

> **getMetadata**(`kind`): `undefined` \| `ArkMetadataType`

Defined in: src/core/base/Stmt.ts:41

#### Parameters

##### kind

`ArkMetadataKind`

#### Returns

`undefined` \| `ArkMetadataType`

***

### getOperandOriginalPosition()

> **getOperandOriginalPosition**(`indexOrOperand`): `null` \| [`FullPosition`](FullPosition.md)

Defined in: src/core/base/Stmt.ts:299

#### Parameters

##### indexOrOperand

`number` | [`Value`](../interfaces/Value.md)

#### Returns

`null` \| [`FullPosition`](FullPosition.md)

***

### getOperandOriginalPositions()

> **getOperandOriginalPositions**(): `undefined` \| [`FullPosition`](FullPosition.md)[]

Defined in: src/core/base/Stmt.ts:295

#### Returns

`undefined` \| [`FullPosition`](FullPosition.md)[]

***

### getOriginalText()

> **getOriginalText**(): `undefined` \| `string`

Defined in: src/core/base/Stmt.ts:287

#### Returns

`undefined` \| `string`

***

### getOriginPositionInfo()

> **getOriginPositionInfo**(): [`LineColPosition`](LineColPosition.md)

Defined in: src/core/base/Stmt.ts:273

Returns the original position of the statement. 
The position consists of two parts: line number and column number. 
In the source file, the former (i.e., line number) indicates which line the statement is in, 
and the latter (i.e., column number) indicates the position of the statement in the line. 
The position is described as `LineColPosition(lineNo,colNum)` in ArkAnalyzer, 
and its default value is LineColPosition(-1,-1).

#### Returns

[`LineColPosition`](LineColPosition.md)

The original location of the statement.

#### Example

1. Get the stmt position info to make some condition judgements.
```typescript
for (const stmt of stmts) {
   if (stmt.getOriginPositionInfo().getLineNo() === -1) {
       stmt.setOriginPositionInfo(originalStmt.getOriginPositionInfo());
       this.stmtToOriginalStmt.set(stmt, originalStmt);
   }
}
```

***

### getTypeExprs()

> **getTypeExprs**(): `AbstractTypeExpr`[]

Defined in: src/core/base/Stmt.ts:188

#### Returns

`AbstractTypeExpr`[]

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Stmt.ts:53

Return a list of values which are uesd in this statement

#### Returns

[`Value`](../interfaces/Value.md)[]

***

### isBranch()

> **isBranch**(): `boolean`

Defined in: src/core/base/Stmt.ts:128

Return true if the following statement may not execute after this statement.
The ArkIfStmt and ArkGotoStmt will return true.

#### Returns

`boolean`

***

### replaceDef()

> **replaceDef**(`oldDef`, `newDef`): `void`

Defined in: src/core/base/Stmt.ts:82

#### Parameters

##### oldDef

[`Value`](../interfaces/Value.md)

##### newDef

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### replaceUse()

> **replaceUse**(`oldUse`, `newUse`): `void`

Defined in: src/core/base/Stmt.ts:57

#### Parameters

##### oldUse

[`Value`](../interfaces/Value.md)

##### newUse

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### setCfg()

> **setCfg**(`cfg`): `void`

Defined in: src/core/base/Stmt.ts:120

#### Parameters

##### cfg

[`Cfg`](Cfg.md)

#### Returns

`void`

***

### setMetadata()

> **setMetadata**(`kind`, `value`): `void`

Defined in: src/core/base/Stmt.ts:45

#### Parameters

##### kind

`ArkMetadataKind`

##### value

`ArkMetadataType`

#### Returns

`void`

***

### setOperandOriginalPositions()

> **setOperandOriginalPositions**(`operandOriginalPositions`): `void`

Defined in: src/core/base/Stmt.ts:291

#### Parameters

##### operandOriginalPositions

[`FullPosition`](FullPosition.md)[]

#### Returns

`void`

***

### setOriginalText()

> **setOriginalText**(`originalText`): `void`

Defined in: src/core/base/Stmt.ts:283

#### Parameters

##### originalText

`string`

#### Returns

`void`

***

### setOriginPositionInfo()

> **setOriginPositionInfo**(`originPositionInfo`): `void`

Defined in: src/core/base/Stmt.ts:250

#### Parameters

##### originPositionInfo

[`LineColPosition`](LineColPosition.md)

#### Returns

`void`

***

### setText()

> **setText**(`text`): `void`

Defined in: src/core/base/Stmt.ts:279

#### Parameters

##### text

`string`

#### Returns

`void`

***

### toString()

> `abstract` **toString**(): `string`

Defined in: src/core/base/Stmt.ts:277

#### Returns

`string`
