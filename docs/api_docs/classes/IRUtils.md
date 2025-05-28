[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / IRUtils

# Class: IRUtils

Defined in: src/core/common/IRUtils.ts:29

## Constructors

### Constructor

> **new IRUtils**(): `IRUtils`

#### Returns

`IRUtils`

## Methods

### adjustOperandOriginalPositions()

> `static` **adjustOperandOriginalPositions**(`stmt`, `oldValue`, `newValue`): `void`

Defined in: src/core/common/IRUtils.ts:110

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### oldValue

[`Value`](../interfaces/Value.md)

##### newValue

[`Value`](../interfaces/Value.md)

#### Returns

`void`

***

### findOperandIdx()

> `static` **findOperandIdx**(`stmt`, `operand`): `number`

Defined in: src/core/common/IRUtils.ts:98

#### Parameters

##### stmt

[`Stmt`](Stmt.md)

##### operand

[`Value`](../interfaces/Value.md)

#### Returns

`number`

***

### generateDefaultPositions()

> `static` **generateDefaultPositions**(`count`): [`FullPosition`](FullPosition.md)[]

Defined in: src/core/common/IRUtils.ts:147

#### Parameters

##### count

`number`

#### Returns

[`FullPosition`](FullPosition.md)[]

***

### generateTextForStmt()

> `static` **generateTextForStmt**(`scene`): `void`

Defined in: src/core/common/IRUtils.ts:44

#### Parameters

##### scene

[`Scene`](Scene.md)

#### Returns

`void`

***

### getCommentsMetadata()

> `static` **getCommentsMetadata**(`node`, `sourceFile`, `options`, `isLeading`): `CommentsMetadata`

Defined in: src/core/common/IRUtils.ts:67

#### Parameters

##### node

[`Node`](../ArkAnalyzer/namespaces/ts/interfaces/Node.md)

##### sourceFile

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

##### options

`SceneOptions`

##### isLeading

`boolean`

#### Returns

`CommentsMetadata`

***

### isTempLocal()

> `static` **isTempLocal**(`value`): `boolean`

Defined in: src/core/common/IRUtils.ts:94

#### Parameters

##### value

[`Value`](../interfaces/Value.md)

#### Returns

`boolean`

***

### moreThanOneAddress()

> `static` **moreThanOneAddress**(`value`): `boolean`

Defined in: src/core/common/IRUtils.ts:30

#### Parameters

##### value

[`Value`](../interfaces/Value.md)

#### Returns

`boolean`

***

### setComments()

> `static` **setComments**(`metadata`, `node`, `sourceFile`, `options`): `void`

Defined in: src/core/common/IRUtils.ts:55

#### Parameters

##### metadata

`ArkBaseModel` | [`Stmt`](Stmt.md)

##### node

[`Node`](../ArkAnalyzer/namespaces/ts/interfaces/Node.md)

##### sourceFile

[`SourceFile`](../ArkAnalyzer/namespaces/ts/interfaces/SourceFile.md)

##### options

`SceneOptions`

#### Returns

`void`
