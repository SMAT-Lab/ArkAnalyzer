[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkAssignStmt

# Class: ArkAssignStmt

Defined in: src/core/base/Stmt.ts:314

## Extends

- [`Stmt`](Stmt.md)

## Constructors

### Constructor

> **new ArkAssignStmt**(`leftOp`, `rightOp`): `ArkAssignStmt`

Defined in: src/core/base/Stmt.ts:318

#### Parameters

##### leftOp

[`Value`](../interfaces/Value.md)

##### rightOp

[`Value`](../interfaces/Value.md)

#### Returns

`ArkAssignStmt`

#### Overrides

[`Stmt`](Stmt.md).[`constructor`](Stmt.md#constructor)

## Properties

### cfg

> `protected` **cfg**: [`Cfg`](Cfg.md)

Defined in: src/core/base/Stmt.ts:36

#### Inherited from

[`Stmt`](Stmt.md).[`cfg`](Stmt.md#cfg)

***

### metadata?

> `optional` **metadata**: `ArkMetadata`

Defined in: src/core/base/Stmt.ts:39

#### Inherited from

[`Stmt`](Stmt.md).[`metadata`](Stmt.md#metadata)

***

### operandOriginalPositions?

> `protected` `optional` **operandOriginalPositions**: [`FullPosition`](FullPosition.md)[]

Defined in: src/core/base/Stmt.ts:37

#### Inherited from

[`Stmt`](Stmt.md).[`operandOriginalPositions`](Stmt.md#operandoriginalpositions)

***

### originalPosition

> `protected` **originalPosition**: [`LineColPosition`](LineColPosition.md) = `LineColPosition.DEFAULT`

Defined in: src/core/base/Stmt.ts:35

#### Inherited from

[`Stmt`](Stmt.md).[`originalPosition`](Stmt.md#originalposition)

***

### originalText?

> `protected` `optional` **originalText**: `string`

Defined in: src/core/base/Stmt.ts:34

#### Inherited from

[`Stmt`](Stmt.md).[`originalText`](Stmt.md#originaltext)

***

### text?

> `protected` `optional` **text**: `string`

Defined in: src/core/base/Stmt.ts:33

#### Inherited from

[`Stmt`](Stmt.md).[`text`](Stmt.md#text)

## Methods

### containsArrayRef()

> **containsArrayRef**(): `boolean`

Defined in: src/core/base/Stmt.ts:199

#### Returns

`boolean`

#### Inherited from

[`Stmt`](Stmt.md).[`containsArrayRef`](Stmt.md#containsarrayref)

***

### containsFieldRef()

> **containsFieldRef**(): `boolean`

Defined in: src/core/base/Stmt.ts:225

#### Returns

`boolean`

#### Inherited from

[`Stmt`](Stmt.md).[`containsFieldRef`](Stmt.md#containsfieldref)

***

### containsInvokeExpr()

> **containsInvokeExpr**(): `boolean`

Defined in: src/core/base/Stmt.ts:137

#### Returns

`boolean`

#### Inherited from

[`Stmt`](Stmt.md).[`containsInvokeExpr`](Stmt.md#containsinvokeexpr)

***

### getArrayRef()

> **getArrayRef**(): `undefined` \| [`ArkArrayRef`](ArkArrayRef.md)

Defined in: src/core/base/Stmt.ts:211

#### Returns

`undefined` \| [`ArkArrayRef`](ArkArrayRef.md)

#### Inherited from

[`Stmt`](Stmt.md).[`getArrayRef`](Stmt.md#getarrayref)

***

### getCfg()

> **getCfg**(): [`Cfg`](Cfg.md)

Defined in: src/core/base/Stmt.ts:116

Get the CFG (i.e., control flow graph) of an [ArkBody](ArkBody.md) in which the statement is.
A CFG contains a set of basic blocks and statements corresponding to each basic block.
Note that, "source code" and "three-address" are two types of [Stmt](Stmt.md) in ArkAnalyzer.
Source code [Stmt](Stmt.md) represents the statement of ets/ts source code, while three-address code [Stmt](Stmt.md)
represents the statement after it has been converted into three-address code.  Since the source code [Stmt](Stmt.md) does not save its CFG reference, it returns **null**, while the `getCfg()` of the third address code
[Stmt](Stmt.md) will return its CFG reference.

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

#### Inherited from

[`Stmt`](Stmt.md).[`getCfg`](Stmt.md#getcfg)

***

### getDef()

> **getDef**(): `null` \| [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Stmt.ts:363

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

#### Overrides

[`Stmt`](Stmt.md).[`getDef`](Stmt.md#getdef)

***

### getDefAndUses()

> **getDefAndUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Stmt.ts:87

#### Returns

[`Value`](../interfaces/Value.md)[]

#### Inherited from

[`Stmt`](Stmt.md).[`getDefAndUses`](Stmt.md#getdefanduses)

***

### getExpectedSuccessorCount()

> **getExpectedSuccessorCount**(): `number`

Defined in: src/core/base/Stmt.ts:133

Return the number of statements which this statement may go to

#### Returns

`number`

#### Inherited from

[`Stmt`](Stmt.md).[`getExpectedSuccessorCount`](Stmt.md#getexpectedsuccessorcount)

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

#### Inherited from

[`Stmt`](Stmt.md).[`getExprs`](Stmt.md#getexprs)

***

### getFieldRef()

> **getFieldRef**(): `undefined` \| [`AbstractFieldRef`](AbstractFieldRef.md)

Defined in: src/core/base/Stmt.ts:238

#### Returns

`undefined` \| [`AbstractFieldRef`](AbstractFieldRef.md)

#### Inherited from

[`Stmt`](Stmt.md).[`getFieldRef`](Stmt.md#getfieldref)

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

#### Inherited from

[`Stmt`](Stmt.md).[`getInvokeExpr`](Stmt.md#getinvokeexpr)

***

### getLeftOp()

> **getLeftOp**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Stmt.ts:331

Returns the left operand of the assigning statement.

#### Returns

[`Value`](../interfaces/Value.md)

The left operand of the assigning statement.

#### Example

```ts
1. If the statement is `a=b;`, the right operand is `a`; if the statement is `dd = cc + 5;`, the right operand
    is `cc`.
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

#### Inherited from

[`Stmt`](Stmt.md).[`getMetadata`](Stmt.md#getmetadata)

***

### getOperandOriginalPosition()

> **getOperandOriginalPosition**(`indexOrOperand`): `null` \| [`FullPosition`](FullPosition.md)

Defined in: src/core/base/Stmt.ts:299

#### Parameters

##### indexOrOperand

`number` | [`Value`](../interfaces/Value.md)

#### Returns

`null` \| [`FullPosition`](FullPosition.md)

#### Inherited from

[`Stmt`](Stmt.md).[`getOperandOriginalPosition`](Stmt.md#getoperandoriginalposition)

***

### getOperandOriginalPositions()

> **getOperandOriginalPositions**(): `undefined` \| [`FullPosition`](FullPosition.md)[]

Defined in: src/core/base/Stmt.ts:295

#### Returns

`undefined` \| [`FullPosition`](FullPosition.md)[]

#### Inherited from

[`Stmt`](Stmt.md).[`getOperandOriginalPositions`](Stmt.md#getoperandoriginalpositions)

***

### getOriginalText()

> **getOriginalText**(): `undefined` \| `string`

Defined in: src/core/base/Stmt.ts:287

#### Returns

`undefined` \| `string`

#### Inherited from

[`Stmt`](Stmt.md).[`getOriginalText`](Stmt.md#getoriginaltext)

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

#### Inherited from

[`Stmt`](Stmt.md).[`getOriginPositionInfo`](Stmt.md#getoriginpositioninfo)

***

### getRightOp()

> **getRightOp**(): [`Value`](../interfaces/Value.md)

Defined in: src/core/base/Stmt.ts:350

Returns the right operand of the assigning statement.

#### Returns

[`Value`](../interfaces/Value.md)

The right operand of the assigning statement.

#### Example

1. If the statement is `a=b;`, the right operand is `b`; if the statement is `dd = cc + 5;`, the right operand
    is `cc + 5`.
2. Get the rightOp from stmt.
```typescript
const rightOp = stmt.getRightOp();
```

***

### getTypeExprs()

> **getTypeExprs**(): `AbstractTypeExpr`[]

Defined in: src/core/base/Stmt.ts:188

#### Returns

`AbstractTypeExpr`[]

#### Inherited from

[`Stmt`](Stmt.md).[`getTypeExprs`](Stmt.md#gettypeexprs)

***

### getUses()

> **getUses**(): [`Value`](../interfaces/Value.md)[]

Defined in: src/core/base/Stmt.ts:367

Return a list of values which are uesd in this statement

#### Returns

[`Value`](../interfaces/Value.md)[]

#### Overrides

[`Stmt`](Stmt.md).[`getUses`](Stmt.md#getuses)

***

### isBranch()

> **isBranch**(): `boolean`

Defined in: src/core/base/Stmt.ts:128

Return true if the following statement may not execute after this statement.
The ArkIfStmt and ArkGotoStmt will return true.

#### Returns

`boolean`

#### Inherited from

[`Stmt`](Stmt.md).[`isBranch`](Stmt.md#isbranch)

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

#### Inherited from

[`Stmt`](Stmt.md).[`replaceDef`](Stmt.md#replacedef)

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

#### Inherited from

[`Stmt`](Stmt.md).[`replaceUse`](Stmt.md#replaceuse)

***

### setCfg()

> **setCfg**(`cfg`): `void`

Defined in: src/core/base/Stmt.ts:120

#### Parameters

##### cfg

[`Cfg`](Cfg.md)

#### Returns

`void`

#### Inherited from

[`Stmt`](Stmt.md).[`setCfg`](Stmt.md#setcfg)

***

### setLeftOp()

> **setLeftOp**(`newLeftOp`): `void`

Defined in: src/core/base/Stmt.ts:335

#### Parameters

##### newLeftOp

[`Value`](../interfaces/Value.md)

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

#### Inherited from

[`Stmt`](Stmt.md).[`setMetadata`](Stmt.md#setmetadata)

***

### setOperandOriginalPositions()

> **setOperandOriginalPositions**(`operandOriginalPositions`): `void`

Defined in: src/core/base/Stmt.ts:291

#### Parameters

##### operandOriginalPositions

[`FullPosition`](FullPosition.md)[]

#### Returns

`void`

#### Inherited from

[`Stmt`](Stmt.md).[`setOperandOriginalPositions`](Stmt.md#setoperandoriginalpositions)

***

### setOriginalText()

> **setOriginalText**(`originalText`): `void`

Defined in: src/core/base/Stmt.ts:283

#### Parameters

##### originalText

`string`

#### Returns

`void`

#### Inherited from

[`Stmt`](Stmt.md).[`setOriginalText`](Stmt.md#setoriginaltext)

***

### setOriginPositionInfo()

> **setOriginPositionInfo**(`originPositionInfo`): `void`

Defined in: src/core/base/Stmt.ts:250

#### Parameters

##### originPositionInfo

[`LineColPosition`](LineColPosition.md)

#### Returns

`void`

#### Inherited from

[`Stmt`](Stmt.md).[`setOriginPositionInfo`](Stmt.md#setoriginpositioninfo)

***

### setRightOp()

> **setRightOp**(`rightOp`): `void`

Defined in: src/core/base/Stmt.ts:354

#### Parameters

##### rightOp

[`Value`](../interfaces/Value.md)

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

#### Inherited from

[`Stmt`](Stmt.md).[`setText`](Stmt.md#settext)

***

### toString()

> **toString**(): `string`

Defined in: src/core/base/Stmt.ts:358

#### Returns

`string`

#### Overrides

[`Stmt`](Stmt.md).[`toString`](Stmt.md#tostring)
