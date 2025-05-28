[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / NodeFactory

# Interface: NodeFactory

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3609

## Methods

### createAdd()

> **createAdd**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4055

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createArrayBindingPattern()

> **createArrayBindingPattern**(`elements`): [`ArrayBindingPattern`](ArrayBindingPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3740

#### Parameters

##### elements

readonly [`ArrayBindingElement`](../type-aliases/ArrayBindingElement.md)[]

#### Returns

[`ArrayBindingPattern`](ArrayBindingPattern.md)

***

### createArrayLiteralExpression()

> **createArrayLiteralExpression**(`elements?`, `multiLine?`): [`ArrayLiteralExpression`](ArrayLiteralExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3744

#### Parameters

##### elements?

readonly [`Expression`](Expression.md)[]

##### multiLine?

`boolean`

#### Returns

[`ArrayLiteralExpression`](ArrayLiteralExpression.md)

***

### createArrayTypeNode()

> **createArrayTypeNode**(`elementType`): [`ArrayTypeNode`](ArrayTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3705

#### Parameters

##### elementType

[`TypeNode`](TypeNode.md)

#### Returns

[`ArrayTypeNode`](ArrayTypeNode.md)

***

### createArrowFunction()

> **createArrowFunction**(`modifiers`, `typeParameters`, `parameters`, `type`, `equalsGreaterThanToken`, `body`): [`ArrowFunction`](ArrowFunction.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3770

#### Parameters

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### equalsGreaterThanToken

`undefined` | [`EqualsGreaterThanToken`](../type-aliases/EqualsGreaterThanToken.md)

##### body

[`ConciseBody`](../type-aliases/ConciseBody.md)

#### Returns

[`ArrowFunction`](ArrowFunction.md)

***

### createAsExpression()

> **createAsExpression**(`expression`, `type`): [`AsExpression`](AsExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3810

#### Parameters

##### expression

[`Expression`](Expression.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`AsExpression`](AsExpression.md)

***

### createAssertClause()

> **createAssertClause**(`elements`, `multiLine?`): [`AssertClause`](AssertClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3889

#### Parameters

##### elements

[`NodeArray`](NodeArray.md)\<[`AssertEntry`](AssertEntry.md)\>

##### multiLine?

`boolean`

#### Returns

[`AssertClause`](AssertClause.md)

***

### createAssertEntry()

> **createAssertEntry**(`name`, `value`): [`AssertEntry`](AssertEntry.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3891

#### Parameters

##### name

[`AssertionKey`](../type-aliases/AssertionKey.md)

##### value

[`Expression`](Expression.md)

#### Returns

[`AssertEntry`](AssertEntry.md)

***

### createAssignment()

#### Call Signature

> **createAssignment**(`left`, `right`): [`DestructuringAssignment`](../type-aliases/DestructuringAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4037

##### Parameters

###### left

[`ObjectLiteralExpression`](ObjectLiteralExpression.md) | [`ArrayLiteralExpression`](ArrayLiteralExpression.md)

###### right

[`Expression`](Expression.md)

##### Returns

[`DestructuringAssignment`](../type-aliases/DestructuringAssignment.md)

#### Call Signature

> **createAssignment**(`left`, `right`): [`AssignmentExpression`](AssignmentExpression.md)\<[`EqualsToken`](../type-aliases/EqualsToken.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4038

##### Parameters

###### left

[`Expression`](Expression.md)

###### right

[`Expression`](Expression.md)

##### Returns

[`AssignmentExpression`](AssignmentExpression.md)\<[`EqualsToken`](../type-aliases/EqualsToken.md)\>

***

### createAwaitExpression()

> **createAwaitExpression**(`expression`): [`AwaitExpression`](AwaitExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3780

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`AwaitExpression`](AwaitExpression.md)

***

### createBigIntLiteral()

> **createBigIntLiteral**(`value`): [`BigIntLiteral`](BigIntLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3612

#### Parameters

##### value

`string` | [`PseudoBigInt`](PseudoBigInt.md)

#### Returns

[`BigIntLiteral`](BigIntLiteral.md)

***

### createBinaryExpression()

> **createBinaryExpression**(`left`, `operator`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3786

#### Parameters

##### left

[`Expression`](Expression.md)

##### operator

[`BinaryOperatorToken`](../type-aliases/BinaryOperatorToken.md) | [`BinaryOperator`](../type-aliases/BinaryOperator.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createBindingElement()

> **createBindingElement**(`dotDotDotToken`, `propertyName`, `name`, `initializer?`): [`BindingElement`](BindingElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3742

#### Parameters

##### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

##### propertyName

`undefined` | `string` | [`PropertyName`](../type-aliases/PropertyName.md)

##### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

##### initializer?

[`Expression`](Expression.md)

#### Returns

[`BindingElement`](BindingElement.md)

***

### createBitwiseAnd()

> **createBitwiseAnd**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4043

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createBitwiseNot()

> **createBitwiseNot**(`operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4065

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createBitwiseOr()

> **createBitwiseOr**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4041

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createBitwiseXor()

> **createBitwiseXor**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4042

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createBlock()

> **createBlock**(`statements`, `multiLine?`): [`Block`](Block.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3823

#### Parameters

##### statements

readonly [`Statement`](Statement.md)[]

##### multiLine?

`boolean`

#### Returns

[`Block`](Block.md)

***

### createBreakStatement()

> **createBreakStatement**(`label?`): [`BreakStatement`](BreakStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3844

#### Parameters

##### label?

`string` | [`Identifier`](Identifier.md)

#### Returns

[`BreakStatement`](BreakStatement.md)

***

### createBundle()

> **createBundle**(`sourceFiles`, `prepends?`): [`Bundle`](Bundle.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4034

#### Parameters

##### sourceFiles

readonly [`SourceFile`](SourceFile.md)[]

##### prepends?

readonly ([`InputFiles`](InputFiles.md) \| [`UnparsedSource`](UnparsedSource.md))[]

#### Returns

[`Bundle`](Bundle.md)

***

### createCallChain()

> **createCallChain**(`expression`, `questionDotToken`, `typeArguments`, `argumentsArray`): [`CallChain`](CallChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3758

#### Parameters

##### expression

[`Expression`](Expression.md)

##### questionDotToken

`undefined` | [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### argumentsArray

`undefined` | readonly [`Expression`](Expression.md)[]

#### Returns

[`CallChain`](CallChain.md)

***

### createCallExpression()

> **createCallExpression**(`expression`, `typeArguments`, `argumentsArray`): [`CallExpression`](CallExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3756

#### Parameters

##### expression

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### argumentsArray

`undefined` | readonly [`Expression`](Expression.md)[]

#### Returns

[`CallExpression`](CallExpression.md)

***

### createCallSignature()

> **createCallSignature**(`typeParameters`, `parameters`, `type`): [`CallSignatureDeclaration`](CallSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3682

#### Parameters

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`CallSignatureDeclaration`](CallSignatureDeclaration.md)

***

### createCaseBlock()

> **createCaseBlock**(`clauses`): [`CaseBlock`](CaseBlock.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3879

#### Parameters

##### clauses

readonly [`CaseOrDefaultClause`](../type-aliases/CaseOrDefaultClause.md)[]

#### Returns

[`CaseBlock`](CaseBlock.md)

***

### createCaseClause()

> **createCaseClause**(`expression`, `statements`): [`CaseClause`](CaseClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4011

#### Parameters

##### expression

[`Expression`](Expression.md)

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`CaseClause`](CaseClause.md)

***

### createCatchClause()

> **createCatchClause**(`variableDeclaration`, `block`): [`CatchClause`](CatchClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4017

#### Parameters

##### variableDeclaration

`undefined` | `string` | [`BindingName`](../type-aliases/BindingName.md) | [`VariableDeclaration`](VariableDeclaration.md)

##### block

[`Block`](Block.md)

#### Returns

[`CatchClause`](CatchClause.md)

***

### createClassDeclaration()

#### Call Signature

> **createClassDeclaration**(`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](ClassDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3865

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`undefined` | `string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassDeclaration`](ClassDeclaration.md)

#### Call Signature

> **createClassDeclaration**(`decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](ClassDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8494

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`undefined` | `string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassDeclaration`](ClassDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createClassExpression()

#### Call Signature

> **createClassExpression**(`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassExpression`](ClassExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3805

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`undefined` | `string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassExpression`](ClassExpression.md)

#### Call Signature

> **createClassExpression**(`decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassExpression`](ClassExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8478

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`undefined` | `string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassExpression`](ClassExpression.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createClassStaticBlockDeclaration()

#### Call Signature

> **createClassStaticBlockDeclaration**(`body`): [`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3690

##### Parameters

###### body

[`Block`](Block.md)

##### Returns

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

#### Call Signature

> **createClassStaticBlockDeclaration**(`decorators`, `modifiers`, `body`): [`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8470

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### body

[`Block`](Block.md)

##### Returns

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

##### Deprecated

Decorators and modifiers are no longer supported for this function. Callers should use an overload that does not accept the `decorators` and `modifiers` parameters.

***

### createComma()

> **createComma**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4036

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createCommaListExpression()

> **createCommaListExpression**(`elements`): [`CommaListExpression`](CommaListExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4032

#### Parameters

##### elements

readonly [`Expression`](Expression.md)[]

#### Returns

[`CommaListExpression`](CommaListExpression.md)

***

### createComputedPropertyName()

> **createComputedPropertyName**(`expression`): [`ComputedPropertyName`](ComputedPropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3660

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`ComputedPropertyName`](ComputedPropertyName.md)

***

### createConditionalExpression()

> **createConditionalExpression**(`condition`, `questionToken`, `whenTrue`, `colonToken`, `whenFalse`): [`ConditionalExpression`](ConditionalExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3788

#### Parameters

##### condition

[`Expression`](Expression.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### whenTrue

[`Expression`](Expression.md)

##### colonToken

`undefined` | [`ColonToken`](../type-aliases/ColonToken.md)

##### whenFalse

[`Expression`](Expression.md)

#### Returns

[`ConditionalExpression`](ConditionalExpression.md)

***

### createConditionalTypeNode()

> **createConditionalTypeNode**(`checkType`, `extendsType`, `trueType`, `falseType`): [`ConditionalTypeNode`](ConditionalTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3719

#### Parameters

##### checkType

[`TypeNode`](TypeNode.md)

##### extendsType

[`TypeNode`](TypeNode.md)

##### trueType

[`TypeNode`](TypeNode.md)

##### falseType

[`TypeNode`](TypeNode.md)

#### Returns

[`ConditionalTypeNode`](ConditionalTypeNode.md)

***

### createConstructorDeclaration()

#### Call Signature

> **createConstructorDeclaration**(`modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](ConstructorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3676

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`ConstructorDeclaration`](ConstructorDeclaration.md)

#### Call Signature

> **createConstructorDeclaration**(`decorators`, `modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](ConstructorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8438

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`ConstructorDeclaration`](ConstructorDeclaration.md)

##### Deprecated

This node does not support Decorators. Callers should use an overload that does not accept a `decorators` parameter.

***

### createConstructorTypeNode()

#### Call Signature

> **createConstructorTypeNode**(`modifiers`, `typeParameters`, `parameters`, `type`): [`ConstructorTypeNode`](ConstructorTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3699

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`ConstructorTypeNode`](ConstructorTypeNode.md)

#### Call Signature

> **createConstructorTypeNode**(`typeParameters`, `parameters`, `type`): [`ConstructorTypeNode`](ConstructorTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8341

##### Parameters

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`ConstructorTypeNode`](ConstructorTypeNode.md)

##### Deprecated

Use the overload that accepts 'modifiers'

***

### createConstructSignature()

> **createConstructSignature**(`typeParameters`, `parameters`, `type`): [`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3684

#### Parameters

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

***

### createContinueStatement()

> **createContinueStatement**(`label?`): [`ContinueStatement`](ContinueStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3842

#### Parameters

##### label?

`string` | [`Identifier`](Identifier.md)

#### Returns

[`ContinueStatement`](ContinueStatement.md)

***

### createDebuggerStatement()

> **createDebuggerStatement**(): [`DebuggerStatement`](DebuggerStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3858

#### Returns

[`DebuggerStatement`](DebuggerStatement.md)

***

### createDecorator()

> **createDecorator**(`expression`): [`Decorator`](Decorator.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3666

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`Decorator`](Decorator.md)

***

### createDefaultClause()

> **createDefaultClause**(`statements`): [`DefaultClause`](DefaultClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4013

#### Parameters

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`DefaultClause`](DefaultClause.md)

***

### createDeleteExpression()

> **createDeleteExpression**(`expression`): [`DeleteExpression`](DeleteExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3774

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`DeleteExpression`](DeleteExpression.md)

***

### createDivide()

> **createDivide**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4058

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createDoStatement()

> **createDoStatement**(`statement`, `expression`): [`DoStatement`](DoStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3832

#### Parameters

##### statement

[`Statement`](Statement.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`DoStatement`](DoStatement.md)

***

### createElementAccessChain()

> **createElementAccessChain**(`expression`, `questionDotToken`, `index`): [`ElementAccessChain`](ElementAccessChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3754

#### Parameters

##### expression

[`Expression`](Expression.md)

##### questionDotToken

`undefined` | [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

##### index

`number` | [`Expression`](Expression.md)

#### Returns

[`ElementAccessChain`](ElementAccessChain.md)

***

### createElementAccessExpression()

> **createElementAccessExpression**(`expression`, `index`): [`ElementAccessExpression`](ElementAccessExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3752

#### Parameters

##### expression

[`Expression`](Expression.md)

##### index

`number` | [`Expression`](Expression.md)

#### Returns

[`ElementAccessExpression`](ElementAccessExpression.md)

***

### createEmptyStatement()

> **createEmptyStatement**(): [`EmptyStatement`](EmptyStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3827

#### Returns

[`EmptyStatement`](EmptyStatement.md)

***

### createEnumDeclaration()

#### Call Signature

> **createEnumDeclaration**(`modifiers`, `name`, `members`): [`EnumDeclaration`](EnumDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3873

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### members

readonly [`EnumMember`](EnumMember.md)[]

##### Returns

[`EnumDeclaration`](EnumDeclaration.md)

#### Call Signature

> **createEnumDeclaration**(`decorators`, `modifiers`, `name`, `members`): [`EnumDeclaration`](EnumDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8518

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### members

readonly [`EnumMember`](EnumMember.md)[]

##### Returns

[`EnumDeclaration`](EnumDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createEnumMember()

> **createEnumMember**(`name`, `initializer?`): [`EnumMember`](EnumMember.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4025

#### Parameters

##### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

##### initializer?

[`Expression`](Expression.md)

#### Returns

[`EnumMember`](EnumMember.md)

***

### createEquality()

> **createEquality**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4046

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createEtsComponentExpression()

> **createEtsComponentExpression**(`name`, `argumentExpression`, `body`): [`EtsComponentExpression`](EtsComponentExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3772

#### Parameters

##### name

[`Expression`](Expression.md)

##### argumentExpression

`undefined` | [`NodeArray`](NodeArray.md)\<[`Expression`](Expression.md)\> | [`Expression`](Expression.md)[]

##### body

`undefined` | [`Block`](Block.md)

#### Returns

[`EtsComponentExpression`](EtsComponentExpression.md)

***

### createExponent()

> **createExponent**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4060

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createExportAssignment()

#### Call Signature

> **createExportAssignment**(`modifiers`, `isExportEquals`, `expression`): [`ExportAssignment`](ExportAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3903

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isExportEquals

`undefined` | `boolean`

###### expression

[`Expression`](Expression.md)

##### Returns

[`ExportAssignment`](ExportAssignment.md)

#### Call Signature

> **createExportAssignment**(`decorators`, `modifiers`, `isExportEquals`, `expression`): [`ExportAssignment`](ExportAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8550

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isExportEquals

`undefined` | `boolean`

###### expression

[`Expression`](Expression.md)

##### Returns

[`ExportAssignment`](ExportAssignment.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createExportDeclaration()

#### Call Signature

> **createExportDeclaration**(`modifiers`, `isTypeOnly`, `exportClause`, `moduleSpecifier?`, `assertClause?`): [`ExportDeclaration`](ExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3905

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### exportClause

`undefined` | [`NamedExportBindings`](../type-aliases/NamedExportBindings.md)

###### moduleSpecifier?

[`Expression`](Expression.md)

###### assertClause?

[`AssertClause`](AssertClause.md)

##### Returns

[`ExportDeclaration`](ExportDeclaration.md)

#### Call Signature

> **createExportDeclaration**(`decorators`, `modifiers`, `isTypeOnly`, `exportClause`, `moduleSpecifier?`, `assertClause?`): [`ExportDeclaration`](ExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8558

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### exportClause

`undefined` | [`NamedExportBindings`](../type-aliases/NamedExportBindings.md)

###### moduleSpecifier?

[`Expression`](Expression.md)

###### assertClause?

[`AssertClause`](AssertClause.md)

##### Returns

[`ExportDeclaration`](ExportDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createExportDefault()

> **createExportDefault**(`expression`): [`ExportAssignment`](ExportAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4074

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`ExportAssignment`](ExportAssignment.md)

***

### createExportSpecifier()

> **createExportSpecifier**(`isTypeOnly`, `propertyName`, `name`): [`ExportSpecifier`](ExportSpecifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3909

#### Parameters

##### isTypeOnly

`boolean`

##### propertyName

`undefined` | `string` | [`Identifier`](Identifier.md)

##### name

`string` | [`Identifier`](Identifier.md)

#### Returns

[`ExportSpecifier`](ExportSpecifier.md)

***

### createExpressionStatement()

> **createExpressionStatement**(`expression`): [`ExpressionStatement`](ExpressionStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3828

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`ExpressionStatement`](ExpressionStatement.md)

***

### createExpressionWithTypeArguments()

> **createExpressionWithTypeArguments**(`expression`, `typeArguments`): [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3808

#### Parameters

##### expression

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

***

### createExternalModuleExport()

> **createExternalModuleExport**(`exportName`): [`ExportDeclaration`](ExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4075

#### Parameters

##### exportName

[`Identifier`](Identifier.md)

#### Returns

[`ExportDeclaration`](ExportDeclaration.md)

***

### createExternalModuleReference()

> **createExternalModuleReference**(`expression`): [`ExternalModuleReference`](ExternalModuleReference.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3911

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`ExternalModuleReference`](ExternalModuleReference.md)

***

### createFalse()

> **createFalse**(): [`FalseLiteral`](FalseLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3655

#### Returns

[`FalseLiteral`](FalseLiteral.md)

***

### createForInStatement()

> **createForInStatement**(`initializer`, `expression`, `statement`): [`ForInStatement`](ForInStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3838

#### Parameters

##### initializer

[`ForInitializer`](../type-aliases/ForInitializer.md)

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`ForInStatement`](ForInStatement.md)

***

### createForOfStatement()

> **createForOfStatement**(`awaitModifier`, `initializer`, `expression`, `statement`): [`ForOfStatement`](ForOfStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3840

#### Parameters

##### awaitModifier

`undefined` | [`AwaitKeyword`](../type-aliases/AwaitKeyword.md)

##### initializer

[`ForInitializer`](../type-aliases/ForInitializer.md)

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`ForOfStatement`](ForOfStatement.md)

***

### createForStatement()

> **createForStatement**(`initializer`, `condition`, `incrementor`, `statement`): [`ForStatement`](ForStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3836

#### Parameters

##### initializer

`undefined` | [`ForInitializer`](../type-aliases/ForInitializer.md)

##### condition

`undefined` | [`Expression`](Expression.md)

##### incrementor

`undefined` | [`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`ForStatement`](ForStatement.md)

***

### createFunctionDeclaration()

#### Call Signature

> **createFunctionDeclaration**(`modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](FunctionDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3863

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

`undefined` | `string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`FunctionDeclaration`](FunctionDeclaration.md)

#### Call Signature

> **createFunctionDeclaration**(`decorators`, `modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](FunctionDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8486

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

`undefined` | `string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`FunctionDeclaration`](FunctionDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createFunctionExpression()

> **createFunctionExpression**(`modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionExpression`](FunctionExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3768

#### Parameters

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

##### name

`undefined` | `string` | [`Identifier`](Identifier.md)

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

`undefined` | readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### body

[`Block`](Block.md)

#### Returns

[`FunctionExpression`](FunctionExpression.md)

***

### createFunctionTypeNode()

> **createFunctionTypeNode**(`typeParameters`, `parameters`, `type`): [`FunctionTypeNode`](FunctionTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3697

#### Parameters

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`FunctionTypeNode`](FunctionTypeNode.md)

***

### createGetAccessorDeclaration()

#### Call Signature

> **createGetAccessorDeclaration**(`modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](GetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3678

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

#### Call Signature

> **createGetAccessorDeclaration**(`decorators`, `modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](GetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8446

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createGreaterThan()

> **createGreaterThan**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4050

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createGreaterThanEquals()

> **createGreaterThanEquals**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4051

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createHeritageClause()

> **createHeritageClause**(`token`, `types`): [`HeritageClause`](HeritageClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4015

#### Parameters

##### token

[`ExtendsKeyword`](../enumerations/SyntaxKind.md#extendskeyword) | [`ImplementsKeyword`](../enumerations/SyntaxKind.md#implementskeyword)

##### types

readonly [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)[]

#### Returns

[`HeritageClause`](HeritageClause.md)

***

### createIdentifier()

> **createIdentifier**(`text`): [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3616

#### Parameters

##### text

`string`

#### Returns

[`Identifier`](Identifier.md)

***

### createIfStatement()

> **createIfStatement**(`expression`, `thenStatement`, `elseStatement?`): [`IfStatement`](IfStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3830

#### Parameters

##### expression

[`Expression`](Expression.md)

##### thenStatement

[`Statement`](Statement.md)

##### elseStatement?

[`Statement`](Statement.md)

#### Returns

[`IfStatement`](IfStatement.md)

***

### createImmediatelyInvokedArrowFunction()

#### Call Signature

> **createImmediatelyInvokedArrowFunction**(`statements`): [`CallExpression`](CallExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4071

##### Parameters

###### statements

readonly [`Statement`](Statement.md)[]

##### Returns

[`CallExpression`](CallExpression.md)

#### Call Signature

> **createImmediatelyInvokedArrowFunction**(`statements`, `param`, `paramValue`): [`CallExpression`](CallExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4072

##### Parameters

###### statements

readonly [`Statement`](Statement.md)[]

###### param

[`ParameterDeclaration`](ParameterDeclaration.md)

###### paramValue

[`Expression`](Expression.md)

##### Returns

[`CallExpression`](CallExpression.md)

***

### createImmediatelyInvokedFunctionExpression()

#### Call Signature

> **createImmediatelyInvokedFunctionExpression**(`statements`): [`CallExpression`](CallExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4069

##### Parameters

###### statements

readonly [`Statement`](Statement.md)[]

##### Returns

[`CallExpression`](CallExpression.md)

#### Call Signature

> **createImmediatelyInvokedFunctionExpression**(`statements`, `param`, `paramValue`): [`CallExpression`](CallExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4070

##### Parameters

###### statements

readonly [`Statement`](Statement.md)[]

###### param

[`ParameterDeclaration`](ParameterDeclaration.md)

###### paramValue

[`Expression`](Expression.md)

##### Returns

[`CallExpression`](CallExpression.md)

***

### createImportClause()

> **createImportClause**(`isTypeOnly`, `name`, `namedBindings`): [`ImportClause`](ImportClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3887

#### Parameters

##### isTypeOnly

`boolean`

##### name

`undefined` | [`Identifier`](Identifier.md)

##### namedBindings

`undefined` | [`NamedImportBindings`](../type-aliases/NamedImportBindings.md)

#### Returns

[`ImportClause`](ImportClause.md)

***

### createImportDeclaration()

#### Call Signature

> **createImportDeclaration**(`modifiers`, `importClause`, `moduleSpecifier`, `assertClause?`): [`ImportDeclaration`](ImportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3885

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### importClause

`undefined` | [`ImportClause`](ImportClause.md)

###### moduleSpecifier

[`Expression`](Expression.md)

###### assertClause?

[`AssertClause`](AssertClause.md)

##### Returns

[`ImportDeclaration`](ImportDeclaration.md)

#### Call Signature

> **createImportDeclaration**(`decorators`, `modifiers`, `importClause`, `moduleSpecifier`, `assertClause?`): [`ImportDeclaration`](ImportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8542

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### importClause

`undefined` | [`ImportClause`](ImportClause.md)

###### moduleSpecifier

[`Expression`](Expression.md)

###### assertClause?

[`AssertClause`](AssertClause.md)

##### Returns

[`ImportDeclaration`](ImportDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createImportEqualsDeclaration()

#### Call Signature

> **createImportEqualsDeclaration**(`modifiers`, `isTypeOnly`, `name`, `moduleReference`): [`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3883

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### name

`string` | [`Identifier`](Identifier.md)

###### moduleReference

[`ModuleReference`](../type-aliases/ModuleReference.md)

##### Returns

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

#### Call Signature

> **createImportEqualsDeclaration**(`decorators`, `modifiers`, `isTypeOnly`, `name`, `moduleReference`): [`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8534

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### name

`string` | [`Identifier`](Identifier.md)

###### moduleReference

[`ModuleReference`](../type-aliases/ModuleReference.md)

##### Returns

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createImportSpecifier()

> **createImportSpecifier**(`isTypeOnly`, `propertyName`, `name`): [`ImportSpecifier`](ImportSpecifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3901

#### Parameters

##### isTypeOnly

`boolean`

##### propertyName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`ImportSpecifier`](ImportSpecifier.md)

***

### createImportTypeAssertionContainer()

> **createImportTypeAssertionContainer**(`clause`, `multiLine?`): [`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3893

#### Parameters

##### clause

[`AssertClause`](AssertClause.md)

##### multiLine?

`boolean`

#### Returns

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

***

### createImportTypeNode()

#### Call Signature

> **createImportTypeNode**(`argument`, `assertions?`, `qualifier?`, `typeArguments?`, `isTypeOf?`): [`ImportTypeNode`](ImportTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3723

##### Parameters

###### argument

[`TypeNode`](TypeNode.md)

###### assertions?

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

###### qualifier?

[`EntityName`](../type-aliases/EntityName.md)

###### typeArguments?

readonly [`TypeNode`](TypeNode.md)[]

###### isTypeOf?

`boolean`

##### Returns

[`ImportTypeNode`](ImportTypeNode.md)

#### Call Signature

> **createImportTypeNode**(`argument`, `assertions?`, `qualifier?`, `typeArguments?`, `isTypeOf?`): [`ImportTypeNode`](ImportTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8348

##### Parameters

###### argument

[`TypeNode`](TypeNode.md)

###### assertions?

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

###### qualifier?

[`EntityName`](../type-aliases/EntityName.md)

###### typeArguments?

readonly [`TypeNode`](TypeNode.md)[]

###### isTypeOf?

`boolean`

##### Returns

[`ImportTypeNode`](ImportTypeNode.md)

#### Call Signature

> **createImportTypeNode**(`argument`, `qualifier?`, `typeArguments?`, `isTypeOf?`): [`ImportTypeNode`](ImportTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8350

##### Parameters

###### argument

[`TypeNode`](TypeNode.md)

###### qualifier?

[`EntityName`](../type-aliases/EntityName.md)

###### typeArguments?

readonly [`TypeNode`](TypeNode.md)[]

###### isTypeOf?

`boolean`

##### Returns

[`ImportTypeNode`](ImportTypeNode.md)

##### Deprecated

Use the overload that accepts 'assertions'

***

### createIndexedAccessTypeNode()

> **createIndexedAccessTypeNode**(`objectType`, `indexType`): [`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3730

#### Parameters

##### objectType

[`TypeNode`](TypeNode.md)

##### indexType

[`TypeNode`](TypeNode.md)

#### Returns

[`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

***

### createIndexSignature()

#### Call Signature

> **createIndexSignature**(`modifiers`, `parameters`, `type`): [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3686

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

#### Call Signature

> **createIndexSignature**(`decorators`, `modifiers`, `parameters`, `type`): [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8462

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createInequality()

> **createInequality**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4047

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createInferTypeNode()

> **createInferTypeNode**(`typeParameter`): [`InferTypeNode`](InferTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3721

#### Parameters

##### typeParameter

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Returns

[`InferTypeNode`](InferTypeNode.md)

***

### createInterfaceDeclaration()

#### Call Signature

> **createInterfaceDeclaration**(`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`InterfaceDeclaration`](InterfaceDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3869

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`TypeElement`](TypeElement.md)[]

##### Returns

[`InterfaceDeclaration`](InterfaceDeclaration.md)

#### Call Signature

> **createInterfaceDeclaration**(`decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`InterfaceDeclaration`](InterfaceDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8502

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`TypeElement`](TypeElement.md)[]

##### Returns

[`InterfaceDeclaration`](InterfaceDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createIntersectionTypeNode()

> **createIntersectionTypeNode**(`types`): [`IntersectionTypeNode`](IntersectionTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3717

#### Parameters

##### types

readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`IntersectionTypeNode`](IntersectionTypeNode.md)

***

### createJSDocAllType()

> **createJSDocAllType**(): [`JSDocAllType`](JSDocAllType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3913

#### Returns

[`JSDocAllType`](JSDocAllType.md)

***

### createJSDocAugmentsTag()

> **createJSDocAugmentsTag**(`tagName`, `className`, `comment?`): [`JSDocAugmentsTag`](JSDocAugmentsTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3963

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### className

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAugmentsTag`](JSDocAugmentsTag.md)

***

### createJSDocAuthorTag()

> **createJSDocAuthorTag**(`tagName`, `comment?`): [`JSDocAuthorTag`](JSDocAuthorTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3967

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAuthorTag`](JSDocAuthorTag.md)

***

### createJSDocCallbackTag()

> **createJSDocCallbackTag**(`tagName`, `typeExpression`, `fullName?`, `comment?`): [`JSDocCallbackTag`](JSDocCallbackTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3961

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocSignature`](JSDocSignature.md)

##### fullName?

[`Identifier`](Identifier.md) | [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocCallbackTag`](JSDocCallbackTag.md)

***

### createJSDocClassTag()

> **createJSDocClassTag**(`tagName`, `comment?`): [`JSDocClassTag`](JSDocClassTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3969

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocClassTag`](JSDocClassTag.md)

***

### createJSDocComment()

> **createJSDocComment**(`comment?`, `tags?`): [`JSDoc`](JSDoc.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3987

#### Parameters

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

##### tags?

readonly [`JSDocTag`](JSDocTag.md)[]

#### Returns

[`JSDoc`](JSDoc.md)

***

### createJSDocDeprecatedTag()

> **createJSDocDeprecatedTag**(`tagName`, `comment?`): [`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3981

#### Parameters

##### tagName

[`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

***

### createJSDocEnumTag()

> **createJSDocEnumTag**(`tagName`, `typeExpression`, `comment?`): [`JSDocEnumTag`](JSDocEnumTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3959

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocEnumTag`](JSDocEnumTag.md)

***

### createJSDocFunctionType()

> **createJSDocFunctionType**(`parameters`, `type`): [`JSDocFunctionType`](JSDocFunctionType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3921

#### Parameters

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocFunctionType`](JSDocFunctionType.md)

***

### createJSDocImplementsTag()

> **createJSDocImplementsTag**(`tagName`, `className`, `comment?`): [`JSDocImplementsTag`](JSDocImplementsTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3965

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### className

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocImplementsTag`](JSDocImplementsTag.md)

***

### createJSDocLink()

> **createJSDocLink**(`name`, `text`): [`JSDocLink`](JSDocLink.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3933

#### Parameters

##### name

`undefined` | [`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### text

`string`

#### Returns

[`JSDocLink`](JSDocLink.md)

***

### createJSDocLinkCode()

> **createJSDocLinkCode**(`name`, `text`): [`JSDocLinkCode`](JSDocLinkCode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3935

#### Parameters

##### name

`undefined` | [`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### text

`string`

#### Returns

[`JSDocLinkCode`](JSDocLinkCode.md)

***

### createJSDocLinkPlain()

> **createJSDocLinkPlain**(`name`, `text`): [`JSDocLinkPlain`](JSDocLinkPlain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3937

#### Parameters

##### name

`undefined` | [`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### text

`string`

#### Returns

[`JSDocLinkPlain`](JSDocLinkPlain.md)

***

### createJSDocMemberName()

> **createJSDocMemberName**(`left`, `right`): [`JSDocMemberName`](JSDocMemberName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3931

#### Parameters

##### left

[`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### right

[`Identifier`](Identifier.md)

#### Returns

[`JSDocMemberName`](JSDocMemberName.md)

***

### createJSDocNamepathType()

> **createJSDocNamepathType**(`type`): [`JSDocNamepathType`](JSDocNamepathType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3925

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNamepathType`](JSDocNamepathType.md)

***

### createJSDocNameReference()

> **createJSDocNameReference**(`name`): [`JSDocNameReference`](JSDocNameReference.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3929

#### Parameters

##### name

[`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

#### Returns

[`JSDocNameReference`](JSDocNameReference.md)

***

### createJSDocNonNullableType()

> **createJSDocNonNullableType**(`type`, `postfix?`): [`JSDocNonNullableType`](JSDocNonNullableType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3915

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

##### postfix?

`boolean`

#### Returns

[`JSDocNonNullableType`](JSDocNonNullableType.md)

***

### createJSDocNullableType()

> **createJSDocNullableType**(`type`, `postfix?`): [`JSDocNullableType`](JSDocNullableType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3917

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

##### postfix?

`boolean`

#### Returns

[`JSDocNullableType`](JSDocNullableType.md)

***

### createJSDocOptionalType()

> **createJSDocOptionalType**(`type`): [`JSDocOptionalType`](JSDocOptionalType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3919

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocOptionalType`](JSDocOptionalType.md)

***

### createJSDocOverrideTag()

> **createJSDocOverrideTag**(`tagName`, `comment?`): [`JSDocOverrideTag`](JSDocOverrideTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3983

#### Parameters

##### tagName

[`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocOverrideTag`](JSDocOverrideTag.md)

***

### createJSDocParameterTag()

> **createJSDocParameterTag**(`tagName`, `name`, `isBracketed`, `typeExpression?`, `isNameFirst?`, `comment?`): [`JSDocParameterTag`](JSDocParameterTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3947

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`EntityName`](../type-aliases/EntityName.md)

##### isBracketed

`boolean`

##### typeExpression?

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### isNameFirst?

`boolean`

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocParameterTag`](JSDocParameterTag.md)

***

### createJSDocPrivateTag()

> **createJSDocPrivateTag**(`tagName`, `comment?`): [`JSDocPrivateTag`](JSDocPrivateTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3973

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPrivateTag`](JSDocPrivateTag.md)

***

### createJSDocPropertyTag()

> **createJSDocPropertyTag**(`tagName`, `name`, `isBracketed`, `typeExpression?`, `isNameFirst?`, `comment?`): [`JSDocPropertyTag`](JSDocPropertyTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3949

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`EntityName`](../type-aliases/EntityName.md)

##### isBracketed

`boolean`

##### typeExpression?

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### isNameFirst?

`boolean`

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPropertyTag`](JSDocPropertyTag.md)

***

### createJSDocProtectedTag()

> **createJSDocProtectedTag**(`tagName`, `comment?`): [`JSDocProtectedTag`](JSDocProtectedTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3975

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocProtectedTag`](JSDocProtectedTag.md)

***

### createJSDocPublicTag()

> **createJSDocPublicTag**(`tagName`, `comment?`): [`JSDocPublicTag`](JSDocPublicTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3971

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPublicTag`](JSDocPublicTag.md)

***

### createJSDocReadonlyTag()

> **createJSDocReadonlyTag**(`tagName`, `comment?`): [`JSDocReadonlyTag`](JSDocReadonlyTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3977

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReadonlyTag`](JSDocReadonlyTag.md)

***

### createJSDocReturnTag()

> **createJSDocReturnTag**(`tagName`, `typeExpression?`, `comment?`): [`JSDocReturnTag`](JSDocReturnTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3955

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression?

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReturnTag`](JSDocReturnTag.md)

***

### createJSDocSeeTag()

> **createJSDocSeeTag**(`tagName`, `nameExpression`, `comment?`): [`JSDocSeeTag`](JSDocSeeTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3953

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### nameExpression

`undefined` | [`JSDocNameReference`](JSDocNameReference.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocSeeTag`](JSDocSeeTag.md)

***

### createJSDocSignature()

> **createJSDocSignature**(`typeParameters`, `parameters`, `type?`): [`JSDocSignature`](JSDocSignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3941

#### Parameters

##### typeParameters

`undefined` | readonly [`JSDocTemplateTag`](JSDocTemplateTag.md)[]

##### parameters

readonly [`JSDocParameterTag`](JSDocParameterTag.md)[]

##### type?

[`JSDocReturnTag`](JSDocReturnTag.md)

#### Returns

[`JSDocSignature`](JSDocSignature.md)

***

### createJSDocTemplateTag()

> **createJSDocTemplateTag**(`tagName`, `constraint`, `typeParameters`, `comment?`): [`JSDocTemplateTag`](JSDocTemplateTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3943

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### constraint

`undefined` | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### typeParameters

readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTemplateTag`](JSDocTemplateTag.md)

***

### createJSDocText()

> **createJSDocText**(`text`): [`JSDocText`](JSDocText.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3985

#### Parameters

##### text

`string`

#### Returns

[`JSDocText`](JSDocText.md)

***

### createJSDocThisTag()

> **createJSDocThisTag**(`tagName`, `typeExpression`, `comment?`): [`JSDocThisTag`](JSDocThisTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3957

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocThisTag`](JSDocThisTag.md)

***

### createJSDocTypedefTag()

> **createJSDocTypedefTag**(`tagName`, `typeExpression?`, `fullName?`, `comment?`): [`JSDocTypedefTag`](JSDocTypedefTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3945

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression?

[`JSDocTypeLiteral`](JSDocTypeLiteral.md) | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### fullName?

[`Identifier`](Identifier.md) | [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypedefTag`](JSDocTypedefTag.md)

***

### createJSDocTypeExpression()

> **createJSDocTypeExpression**(`type`): [`JSDocTypeExpression`](JSDocTypeExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3927

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocTypeExpression`](JSDocTypeExpression.md)

***

### createJSDocTypeLiteral()

> **createJSDocTypeLiteral**(`jsDocPropertyTags?`, `isArrayType?`): [`JSDocTypeLiteral`](JSDocTypeLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3939

#### Parameters

##### jsDocPropertyTags?

readonly [`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md)[]

##### isArrayType?

`boolean`

#### Returns

[`JSDocTypeLiteral`](JSDocTypeLiteral.md)

***

### createJSDocTypeTag()

> **createJSDocTypeTag**(`tagName`, `typeExpression`, `comment?`): [`JSDocTypeTag`](JSDocTypeTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3951

#### Parameters

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypeTag`](JSDocTypeTag.md)

***

### createJSDocUnknownTag()

> **createJSDocUnknownTag**(`tagName`, `comment?`): [`JSDocUnknownTag`](JSDocUnknownTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3979

#### Parameters

##### tagName

[`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocUnknownTag`](JSDocUnknownTag.md)

***

### createJSDocUnknownType()

> **createJSDocUnknownType**(): [`JSDocUnknownType`](JSDocUnknownType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3914

#### Returns

[`JSDocUnknownType`](JSDocUnknownType.md)

***

### createJSDocVariadicType()

> **createJSDocVariadicType**(`type`): [`JSDocVariadicType`](JSDocVariadicType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3923

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocVariadicType`](JSDocVariadicType.md)

***

### createJsxAttribute()

> **createJsxAttribute**(`name`, `initializer`): [`JsxAttribute`](JsxAttribute.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4003

#### Parameters

##### name

[`Identifier`](Identifier.md)

##### initializer

`undefined` | [`JsxAttributeValue`](../type-aliases/JsxAttributeValue.md)

#### Returns

[`JsxAttribute`](JsxAttribute.md)

***

### createJsxAttributes()

> **createJsxAttributes**(`properties`): [`JsxAttributes`](JsxAttributes.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4005

#### Parameters

##### properties

readonly [`JsxAttributeLike`](../type-aliases/JsxAttributeLike.md)[]

#### Returns

[`JsxAttributes`](JsxAttributes.md)

***

### createJsxClosingElement()

> **createJsxClosingElement**(`tagName`): [`JsxClosingElement`](JsxClosingElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3995

#### Parameters

##### tagName

[`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

#### Returns

[`JsxClosingElement`](JsxClosingElement.md)

***

### createJsxElement()

> **createJsxElement**(`openingElement`, `children`, `closingElement`): [`JsxElement`](JsxElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3989

#### Parameters

##### openingElement

[`JsxOpeningElement`](JsxOpeningElement.md)

##### children

readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

##### closingElement

[`JsxClosingElement`](JsxClosingElement.md)

#### Returns

[`JsxElement`](JsxElement.md)

***

### createJsxExpression()

> **createJsxExpression**(`dotDotDotToken`, `expression`): [`JsxExpression`](JsxExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4009

#### Parameters

##### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

##### expression

`undefined` | [`Expression`](Expression.md)

#### Returns

[`JsxExpression`](JsxExpression.md)

***

### createJsxFragment()

> **createJsxFragment**(`openingFragment`, `children`, `closingFragment`): [`JsxFragment`](JsxFragment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3997

#### Parameters

##### openingFragment

[`JsxOpeningFragment`](JsxOpeningFragment.md)

##### children

readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

##### closingFragment

[`JsxClosingFragment`](JsxClosingFragment.md)

#### Returns

[`JsxFragment`](JsxFragment.md)

***

### createJsxJsxClosingFragment()

> **createJsxJsxClosingFragment**(): [`JsxClosingFragment`](JsxClosingFragment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4001

#### Returns

[`JsxClosingFragment`](JsxClosingFragment.md)

***

### createJsxOpeningElement()

> **createJsxOpeningElement**(`tagName`, `typeArguments`, `attributes`): [`JsxOpeningElement`](JsxOpeningElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3993

#### Parameters

##### tagName

[`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### attributes

[`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxOpeningElement`](JsxOpeningElement.md)

***

### createJsxOpeningFragment()

> **createJsxOpeningFragment**(): [`JsxOpeningFragment`](JsxOpeningFragment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4000

#### Returns

[`JsxOpeningFragment`](JsxOpeningFragment.md)

***

### createJsxSelfClosingElement()

> **createJsxSelfClosingElement**(`tagName`, `typeArguments`, `attributes`): [`JsxSelfClosingElement`](JsxSelfClosingElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3991

#### Parameters

##### tagName

[`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### attributes

[`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxSelfClosingElement`](JsxSelfClosingElement.md)

***

### createJsxSpreadAttribute()

> **createJsxSpreadAttribute**(`expression`): [`JsxSpreadAttribute`](JsxSpreadAttribute.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4007

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`JsxSpreadAttribute`](JsxSpreadAttribute.md)

***

### createJsxText()

> **createJsxText**(`text`, `containsOnlyTriviaWhiteSpaces?`): [`JsxText`](JsxText.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3998

#### Parameters

##### text

`string`

##### containsOnlyTriviaWhiteSpaces?

`boolean`

#### Returns

[`JsxText`](JsxText.md)

***

### createKeywordTypeNode()

> **createKeywordTypeNode**\<`TKind`\>(`kind`): [`KeywordTypeNode`](KeywordTypeNode.md)\<`TKind`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3692

#### Type Parameters

##### TKind

`TKind` *extends* [`KeywordTypeSyntaxKind`](../type-aliases/KeywordTypeSyntaxKind.md)

#### Parameters

##### kind

`TKind`

#### Returns

[`KeywordTypeNode`](KeywordTypeNode.md)\<`TKind`\>

***

### createLabeledStatement()

> **createLabeledStatement**(`label`, `statement`): [`LabeledStatement`](LabeledStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3852

#### Parameters

##### label

`string` | [`Identifier`](Identifier.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`LabeledStatement`](LabeledStatement.md)

***

### createLeftShift()

> **createLeftShift**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4052

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createLessThan()

> **createLessThan**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4048

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createLessThanEquals()

> **createLessThanEquals**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4049

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createLiteralTypeNode()

> **createLiteralTypeNode**(`literal`): [`LiteralTypeNode`](LiteralTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3734

#### Parameters

##### literal

[`LiteralExpression`](LiteralExpression.md) | [`PrefixUnaryExpression`](PrefixUnaryExpression.md) | [`NullLiteral`](NullLiteral.md) | [`BooleanLiteral`](../type-aliases/BooleanLiteral.md)

#### Returns

[`LiteralTypeNode`](LiteralTypeNode.md)

***

### createLogicalAnd()

> **createLogicalAnd**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4040

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createLogicalNot()

> **createLogicalNot**(`operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4066

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createLogicalOr()

> **createLogicalOr**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4039

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createLoopVariable()

> **createLoopVariable**(`reservedInNestedScopes?`): [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3633

Create a unique temporary variable for use in a loop.

#### Parameters

##### reservedInNestedScopes?

`boolean`

When `true`, reserves the temporary variable name in all nested scopes
during emit so that the variable can be referenced in a nested function body. This is an alternative to
setting `EmitFlags.ReuseTempVariableScope` on the nested function itself.

#### Returns

[`Identifier`](Identifier.md)

***

### createMappedTypeNode()

> **createMappedTypeNode**(`readonlyToken`, `typeParameter`, `nameType`, `questionToken`, `type`, `members`): [`MappedTypeNode`](MappedTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3732

#### Parameters

##### readonlyToken

`undefined` | [`ReadonlyKeyword`](../type-aliases/ReadonlyKeyword.md) | [`PlusToken`](../type-aliases/PlusToken.md) | [`MinusToken`](../type-aliases/MinusToken.md)

##### typeParameter

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

##### nameType

`undefined` | [`TypeNode`](TypeNode.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`PlusToken`](../type-aliases/PlusToken.md) | [`MinusToken`](../type-aliases/MinusToken.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### members

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeElement`](TypeElement.md)\>

#### Returns

[`MappedTypeNode`](MappedTypeNode.md)

***

### createMetaProperty()

> **createMetaProperty**(`keywordToken`, `name`): [`MetaProperty`](MetaProperty.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3816

#### Parameters

##### keywordToken

[`ImportKeyword`](../enumerations/SyntaxKind.md#importkeyword) | [`NewKeyword`](../enumerations/SyntaxKind.md#newkeyword)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`MetaProperty`](MetaProperty.md)

***

### createMethodDeclaration()

#### Call Signature

> **createMethodDeclaration**(`modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](MethodDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3674

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`MethodDeclaration`](MethodDeclaration.md)

#### Call Signature

> **createMethodDeclaration**(`decorators`, `modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](MethodDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8430

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`MethodDeclaration`](MethodDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createMethodSignature()

> **createMethodSignature**(`modifiers`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`): [`MethodSignature`](MethodSignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3672

#### Parameters

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### createModifier()

> **createModifier**\<`T`\>(`kind`): [`ModifierToken`](ModifierToken.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3656

#### Type Parameters

##### T

`T` *extends* [`ModifierSyntaxKind`](../type-aliases/ModifierSyntaxKind.md)

#### Parameters

##### kind

`T`

#### Returns

[`ModifierToken`](ModifierToken.md)\<`T`\>

***

### createModifiersFromModifierFlags()

> **createModifiersFromModifierFlags**(`flags`): `undefined` \| [`Modifier`](../type-aliases/Modifier.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3657

#### Parameters

##### flags

[`ModifierFlags`](../enumerations/ModifierFlags.md)

#### Returns

`undefined` \| [`Modifier`](../type-aliases/Modifier.md)[]

***

### createModuleBlock()

> **createModuleBlock**(`statements`): [`ModuleBlock`](ModuleBlock.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3877

#### Parameters

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`ModuleBlock`](ModuleBlock.md)

***

### createModuleDeclaration()

#### Call Signature

> **createModuleDeclaration**(`modifiers`, `name`, `body`, `flags?`): [`ModuleDeclaration`](ModuleDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3875

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`ModuleName`](../type-aliases/ModuleName.md)

###### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

###### flags?

[`NodeFlags`](../enumerations/NodeFlags.md)

##### Returns

[`ModuleDeclaration`](ModuleDeclaration.md)

#### Call Signature

> **createModuleDeclaration**(`decorators`, `modifiers`, `name`, `body`, `flags?`): [`ModuleDeclaration`](ModuleDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8526

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`ModuleName`](../type-aliases/ModuleName.md)

###### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

###### flags?

[`NodeFlags`](../enumerations/NodeFlags.md)

##### Returns

[`ModuleDeclaration`](ModuleDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createModulo()

> **createModulo**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4059

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createMultiply()

> **createMultiply**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4057

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createNamedExports()

> **createNamedExports**(`elements`): [`NamedExports`](NamedExports.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3907

#### Parameters

##### elements

readonly [`ExportSpecifier`](ExportSpecifier.md)[]

#### Returns

[`NamedExports`](NamedExports.md)

***

### createNamedImports()

> **createNamedImports**(`elements`): [`NamedImports`](NamedImports.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3899

#### Parameters

##### elements

readonly [`ImportSpecifier`](ImportSpecifier.md)[]

#### Returns

[`NamedImports`](NamedImports.md)

***

### createNamedTupleMember()

> **createNamedTupleMember**(`dotDotDotToken`, `name`, `questionToken`, `type`): [`NamedTupleMember`](NamedTupleMember.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3709

#### Parameters

##### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

##### name

[`Identifier`](Identifier.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`NamedTupleMember`](NamedTupleMember.md)

***

### createNamespaceExport()

> **createNamespaceExport**(`name`): [`NamespaceExport`](NamespaceExport.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3897

#### Parameters

##### name

[`Identifier`](Identifier.md)

#### Returns

[`NamespaceExport`](NamespaceExport.md)

***

### createNamespaceExportDeclaration()

> **createNamespaceExportDeclaration**(`name`): [`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3881

#### Parameters

##### name

`string` | [`Identifier`](Identifier.md)

#### Returns

[`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

***

### createNamespaceImport()

> **createNamespaceImport**(`name`): [`NamespaceImport`](NamespaceImport.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3895

#### Parameters

##### name

[`Identifier`](Identifier.md)

#### Returns

[`NamespaceImport`](NamespaceImport.md)

***

### createNewExpression()

> **createNewExpression**(`expression`, `typeArguments`, `argumentsArray`): [`NewExpression`](NewExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3760

#### Parameters

##### expression

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### argumentsArray

`undefined` | readonly [`Expression`](Expression.md)[]

#### Returns

[`NewExpression`](NewExpression.md)

***

### createNodeArray()

> **createNodeArray**\<`T`\>(`elements?`, `hasTrailingComma?`): [`NodeArray`](NodeArray.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3610

#### Type Parameters

##### T

`T` *extends* [`Node`](Node.md)

#### Parameters

##### elements?

readonly `T`[]

##### hasTrailingComma?

`boolean`

#### Returns

[`NodeArray`](NodeArray.md)\<`T`\>

***

### createNonNullChain()

> **createNonNullChain**(`expression`): [`NonNullChain`](NonNullChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3814

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`NonNullChain`](NonNullChain.md)

***

### createNonNullExpression()

> **createNonNullExpression**(`expression`): [`NonNullExpression`](NonNullExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3812

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`NonNullExpression`](NonNullExpression.md)

***

### createNoSubstitutionTemplateLiteral()

#### Call Signature

> **createNoSubstitutionTemplateLiteral**(`text`, `rawText?`): [`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3798

##### Parameters

###### text

`string`

###### rawText?

`string`

##### Returns

[`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)

#### Call Signature

> **createNoSubstitutionTemplateLiteral**(`text`, `rawText`): [`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3799

##### Parameters

###### text

`undefined` | `string`

###### rawText

`string`

##### Returns

[`NoSubstitutionTemplateLiteral`](NoSubstitutionTemplateLiteral.md)

***

### createNotEmittedStatement()

> **createNotEmittedStatement**(`original`): [`NotEmittedStatement`](NotEmittedStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4029

#### Parameters

##### original

[`Node`](Node.md)

#### Returns

[`NotEmittedStatement`](NotEmittedStatement.md)

***

### createNull()

> **createNull**(): [`NullLiteral`](NullLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3653

#### Returns

[`NullLiteral`](NullLiteral.md)

***

### createNumericLiteral()

> **createNumericLiteral**(`value`, `numericLiteralFlags?`): [`NumericLiteral`](NumericLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3611

#### Parameters

##### value

`string` | `number`

##### numericLiteralFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

#### Returns

[`NumericLiteral`](NumericLiteral.md)

***

### createObjectBindingPattern()

> **createObjectBindingPattern**(`elements`): [`ObjectBindingPattern`](ObjectBindingPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3738

#### Parameters

##### elements

readonly [`BindingElement`](BindingElement.md)[]

#### Returns

[`ObjectBindingPattern`](ObjectBindingPattern.md)

***

### createObjectLiteralExpression()

> **createObjectLiteralExpression**(`properties?`, `multiLine?`): [`ObjectLiteralExpression`](ObjectLiteralExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3746

#### Parameters

##### properties?

readonly [`ObjectLiteralElementLike`](../type-aliases/ObjectLiteralElementLike.md)[]

##### multiLine?

`boolean`

#### Returns

[`ObjectLiteralExpression`](ObjectLiteralExpression.md)

***

### createOmittedExpression()

> **createOmittedExpression**(): [`OmittedExpression`](OmittedExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3807

#### Returns

[`OmittedExpression`](OmittedExpression.md)

***

### createOptionalTypeNode()

> **createOptionalTypeNode**(`type`): [`OptionalTypeNode`](OptionalTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3711

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`OptionalTypeNode`](OptionalTypeNode.md)

***

### createParameterDeclaration()

#### Call Signature

> **createParameterDeclaration**(`modifiers`, `dotDotDotToken`, `name`, `questionToken?`, `type?`, `initializer?`): [`ParameterDeclaration`](ParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3664

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

###### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

###### questionToken?

[`QuestionToken`](../type-aliases/QuestionToken.md)

###### type?

[`TypeNode`](TypeNode.md)

###### initializer?

[`Expression`](Expression.md)

##### Returns

[`ParameterDeclaration`](ParameterDeclaration.md)

#### Call Signature

> **createParameterDeclaration**(`decorators`, `modifiers`, `dotDotDotToken`, `name`, `questionToken?`, `type?`, `initializer?`): [`ParameterDeclaration`](ParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8414

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

###### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

###### questionToken?

[`QuestionToken`](../type-aliases/QuestionToken.md)

###### type?

[`TypeNode`](TypeNode.md)

###### initializer?

[`Expression`](Expression.md)

##### Returns

[`ParameterDeclaration`](ParameterDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createParenthesizedExpression()

> **createParenthesizedExpression**(`expression`): [`ParenthesizedExpression`](ParenthesizedExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3766

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`ParenthesizedExpression`](ParenthesizedExpression.md)

***

### createParenthesizedType()

> **createParenthesizedType**(`type`): [`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3725

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

***

### createPartiallyEmittedExpression()

> **createPartiallyEmittedExpression**(`expression`, `original?`): [`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4030

#### Parameters

##### expression

[`Expression`](Expression.md)

##### original?

[`Node`](Node.md)

#### Returns

[`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

***

### createPostfixDecrement()

> **createPostfixDecrement**(`operand`): [`PostfixUnaryExpression`](PostfixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4068

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

***

### createPostfixIncrement()

> **createPostfixIncrement**(`operand`): [`PostfixUnaryExpression`](PostfixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4067

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

***

### createPostfixUnaryExpression()

> **createPostfixUnaryExpression**(`operand`, `operator`): [`PostfixUnaryExpression`](PostfixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3784

#### Parameters

##### operand

[`Expression`](Expression.md)

##### operator

[`PostfixUnaryOperator`](../type-aliases/PostfixUnaryOperator.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

***

### createPrefixDecrement()

> **createPrefixDecrement**(`operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4064

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createPrefixIncrement()

> **createPrefixIncrement**(`operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4063

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createPrefixMinus()

> **createPrefixMinus**(`operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4062

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createPrefixPlus()

> **createPrefixPlus**(`operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4061

#### Parameters

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createPrefixUnaryExpression()

> **createPrefixUnaryExpression**(`operator`, `operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3782

#### Parameters

##### operator

[`PrefixUnaryOperator`](../type-aliases/PrefixUnaryOperator.md)

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### createPrivateIdentifier()

> **createPrivateIdentifier**(`text`): [`PrivateIdentifier`](PrivateIdentifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3638

#### Parameters

##### text

`string`

#### Returns

[`PrivateIdentifier`](PrivateIdentifier.md)

***

### createPropertyAccessChain()

> **createPropertyAccessChain**(`expression`, `questionDotToken`, `name`): [`PropertyAccessChain`](PropertyAccessChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3750

#### Parameters

##### expression

[`Expression`](Expression.md)

##### questionDotToken

`undefined` | [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

##### name

`string` | [`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessChain`](PropertyAccessChain.md)

***

### createPropertyAccessExpression()

> **createPropertyAccessExpression**(`expression`, `name`): [`PropertyAccessExpression`](PropertyAccessExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3748

#### Parameters

##### expression

[`Expression`](Expression.md)

##### name

`string` | [`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessExpression`](PropertyAccessExpression.md)

***

### createPropertyAssignment()

> **createPropertyAssignment**(`name`, `initializer`): [`PropertyAssignment`](PropertyAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4019

#### Parameters

##### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

##### initializer

[`Expression`](Expression.md)

#### Returns

[`PropertyAssignment`](PropertyAssignment.md)

***

### createPropertyDeclaration()

#### Call Signature

> **createPropertyDeclaration**(`modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](PropertyDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3670

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### questionOrExclamationToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### initializer

`undefined` | [`Expression`](Expression.md)

##### Returns

[`PropertyDeclaration`](PropertyDeclaration.md)

#### Call Signature

> **createPropertyDeclaration**(`decorators`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](PropertyDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8422

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### questionOrExclamationToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### initializer

`undefined` | [`Expression`](Expression.md)

##### Returns

[`PropertyDeclaration`](PropertyDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createPropertySignature()

> **createPropertySignature**(`modifiers`, `name`, `questionToken`, `type`): [`PropertySignature`](PropertySignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3668

#### Parameters

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`PropertySignature`](PropertySignature.md)

***

### createQualifiedName()

> **createQualifiedName**(`left`, `right`): [`QualifiedName`](QualifiedName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3658

#### Parameters

##### left

[`EntityName`](../type-aliases/EntityName.md)

##### right

`string` | [`Identifier`](Identifier.md)

#### Returns

[`QualifiedName`](QualifiedName.md)

***

### createRegularExpressionLiteral()

> **createRegularExpressionLiteral**(`text`): [`RegularExpressionLiteral`](RegularExpressionLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3615

#### Parameters

##### text

`string`

#### Returns

[`RegularExpressionLiteral`](RegularExpressionLiteral.md)

***

### createRestTypeNode()

> **createRestTypeNode**(`type`): [`RestTypeNode`](RestTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3713

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`RestTypeNode`](RestTypeNode.md)

***

### createReturnStatement()

> **createReturnStatement**(`expression?`): [`ReturnStatement`](ReturnStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3846

#### Parameters

##### expression?

[`Expression`](Expression.md)

#### Returns

[`ReturnStatement`](ReturnStatement.md)

***

### createRightShift()

> **createRightShift**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4053

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createSatisfiesExpression()

> **createSatisfiesExpression**(`expression`, `type`): [`SatisfiesExpression`](SatisfiesExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3818

#### Parameters

##### expression

[`Expression`](Expression.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`SatisfiesExpression`](SatisfiesExpression.md)

***

### createSemicolonClassElement()

> **createSemicolonClassElement**(): [`SemicolonClassElement`](SemicolonClassElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3822

#### Returns

[`SemicolonClassElement`](SemicolonClassElement.md)

***

### createSetAccessorDeclaration()

#### Call Signature

> **createSetAccessorDeclaration**(`modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](SetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3680

##### Parameters

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

#### Call Signature

> **createSetAccessorDeclaration**(`decorators`, `modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](SetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8454

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### createShorthandPropertyAssignment()

> **createShorthandPropertyAssignment**(`name`, `objectAssignmentInitializer?`): [`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4021

#### Parameters

##### name

`string` | [`Identifier`](Identifier.md)

##### objectAssignmentInitializer?

[`Expression`](Expression.md)

#### Returns

[`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

***

### createSourceFile()

> **createSourceFile**(`statements`, `endOfFileToken`, `flags`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4027

#### Parameters

##### statements

readonly [`Statement`](Statement.md)[]

##### endOfFileToken

[`EndOfFileToken`](../type-aliases/EndOfFileToken.md)

##### flags

[`NodeFlags`](../enumerations/NodeFlags.md)

#### Returns

[`SourceFile`](SourceFile.md)

***

### createSpreadAssignment()

> **createSpreadAssignment**(`expression`): [`SpreadAssignment`](SpreadAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4023

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`SpreadAssignment`](SpreadAssignment.md)

***

### createSpreadElement()

> **createSpreadElement**(`expression`): [`SpreadElement`](SpreadElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3803

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`SpreadElement`](SpreadElement.md)

***

### createStrictEquality()

> **createStrictEquality**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4044

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createStrictInequality()

> **createStrictInequality**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4045

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createStringLiteral()

> **createStringLiteral**(`text`, `isSingleQuote?`): [`StringLiteral`](StringLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3613

#### Parameters

##### text

`string`

##### isSingleQuote?

`boolean`

#### Returns

[`StringLiteral`](StringLiteral.md)

***

### createStringLiteralFromNode()

> **createStringLiteralFromNode**(`sourceNode`, `isSingleQuote?`): [`StringLiteral`](StringLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3614

#### Parameters

##### sourceNode

[`PrivateIdentifier`](PrivateIdentifier.md) | [`PropertyNameLiteral`](../type-aliases/PropertyNameLiteral.md)

##### isSingleQuote?

`boolean`

#### Returns

[`StringLiteral`](StringLiteral.md)

***

### createStructDeclaration()

> **createStructDeclaration**(`modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`StructDeclaration`](StructDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3867

#### Parameters

##### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

##### name

`undefined` | `string` | [`Identifier`](Identifier.md)

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

##### members

readonly [`ClassElement`](ClassElement.md)[]

#### Returns

[`StructDeclaration`](StructDeclaration.md)

***

### createSubtract()

> **createSubtract**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4056

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createSuper()

> **createSuper**(): [`SuperExpression`](SuperExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3651

#### Returns

[`SuperExpression`](SuperExpression.md)

***

### createSwitchStatement()

> **createSwitchStatement**(`expression`, `caseBlock`): [`SwitchStatement`](SwitchStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3850

#### Parameters

##### expression

[`Expression`](Expression.md)

##### caseBlock

[`CaseBlock`](CaseBlock.md)

#### Returns

[`SwitchStatement`](SwitchStatement.md)

***

### createTaggedTemplateExpression()

> **createTaggedTemplateExpression**(`tag`, `typeArguments`, `template`): [`TaggedTemplateExpression`](TaggedTemplateExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3762

#### Parameters

##### tag

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### template

[`TemplateLiteral`](../type-aliases/TemplateLiteral.md)

#### Returns

[`TaggedTemplateExpression`](TaggedTemplateExpression.md)

***

### createTemplateExpression()

> **createTemplateExpression**(`head`, `templateSpans`): [`TemplateExpression`](TemplateExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3790

#### Parameters

##### head

[`TemplateHead`](TemplateHead.md)

##### templateSpans

readonly [`TemplateSpan`](TemplateSpan.md)[]

#### Returns

[`TemplateExpression`](TemplateExpression.md)

***

### createTemplateHead()

#### Call Signature

> **createTemplateHead**(`text`, `rawText?`, `templateFlags?`): [`TemplateHead`](TemplateHead.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3792

##### Parameters

###### text

`string`

###### rawText?

`string`

###### templateFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateHead`](TemplateHead.md)

#### Call Signature

> **createTemplateHead**(`text`, `rawText`, `templateFlags?`): [`TemplateHead`](TemplateHead.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3793

##### Parameters

###### text

`undefined` | `string`

###### rawText

`string`

###### templateFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateHead`](TemplateHead.md)

***

### createTemplateLiteralType()

> **createTemplateLiteralType**(`head`, `templateSpans`): [`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3736

#### Parameters

##### head

[`TemplateHead`](TemplateHead.md)

##### templateSpans

readonly [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)[]

#### Returns

[`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

***

### createTemplateLiteralTypeSpan()

> **createTemplateLiteralTypeSpan**(`type`, `literal`): [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3688

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

##### literal

[`TemplateMiddle`](TemplateMiddle.md) | [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

***

### createTemplateMiddle()

#### Call Signature

> **createTemplateMiddle**(`text`, `rawText?`, `templateFlags?`): [`TemplateMiddle`](TemplateMiddle.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3794

##### Parameters

###### text

`string`

###### rawText?

`string`

###### templateFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateMiddle`](TemplateMiddle.md)

#### Call Signature

> **createTemplateMiddle**(`text`, `rawText`, `templateFlags?`): [`TemplateMiddle`](TemplateMiddle.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3795

##### Parameters

###### text

`undefined` | `string`

###### rawText

`string`

###### templateFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateMiddle`](TemplateMiddle.md)

***

### createTemplateSpan()

> **createTemplateSpan**(`expression`, `literal`): [`TemplateSpan`](TemplateSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3820

#### Parameters

##### expression

[`Expression`](Expression.md)

##### literal

[`TemplateMiddle`](TemplateMiddle.md) | [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateSpan`](TemplateSpan.md)

***

### createTemplateTail()

#### Call Signature

> **createTemplateTail**(`text`, `rawText?`, `templateFlags?`): [`TemplateTail`](TemplateTail.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3796

##### Parameters

###### text

`string`

###### rawText?

`string`

###### templateFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateTail`](TemplateTail.md)

#### Call Signature

> **createTemplateTail**(`text`, `rawText`, `templateFlags?`): [`TemplateTail`](TemplateTail.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3797

##### Parameters

###### text

`undefined` | `string`

###### rawText

`string`

###### templateFlags?

[`TokenFlags`](../enumerations/TokenFlags.md)

##### Returns

[`TemplateTail`](TemplateTail.md)

***

### createTempVariable()

> **createTempVariable**(`recordTempVariable`, `reservedInNestedScopes?`): [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3626

Create a unique temporary variable.

#### Parameters

##### recordTempVariable

An optional callback used to record the temporary variable name. This
should usually be a reference to `hoistVariableDeclaration` from a `TransformationContext`, but
can be `undefined` if you plan to record the temporary variable manually.

`undefined` | (`node`) => `void`

##### reservedInNestedScopes?

`boolean`

When `true`, reserves the temporary variable name in all nested scopes
during emit so that the variable can be referenced in a nested function body. This is an alternative to
setting `EmitFlags.ReuseTempVariableScope` on the nested function itself.

#### Returns

[`Identifier`](Identifier.md)

***

### createThis()

> **createThis**(): [`ThisExpression`](ThisExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3652

#### Returns

[`ThisExpression`](ThisExpression.md)

***

### createThisTypeNode()

> **createThisTypeNode**(): [`ThisTypeNode`](ThisTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3727

#### Returns

[`ThisTypeNode`](ThisTypeNode.md)

***

### createThrowStatement()

> **createThrowStatement**(`expression`): [`ThrowStatement`](ThrowStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3854

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`ThrowStatement`](ThrowStatement.md)

***

### createToken()

#### Call Signature

> **createToken**(`token`): [`SuperExpression`](SuperExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3641

##### Parameters

###### token

[`SuperKeyword`](../enumerations/SyntaxKind.md#superkeyword)

##### Returns

[`SuperExpression`](SuperExpression.md)

#### Call Signature

> **createToken**(`token`): [`ThisExpression`](ThisExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3642

##### Parameters

###### token

[`ThisKeyword`](../enumerations/SyntaxKind.md#thiskeyword)

##### Returns

[`ThisExpression`](ThisExpression.md)

#### Call Signature

> **createToken**(`token`): [`NullLiteral`](NullLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3643

##### Parameters

###### token

[`NullKeyword`](../enumerations/SyntaxKind.md#nullkeyword)

##### Returns

[`NullLiteral`](NullLiteral.md)

#### Call Signature

> **createToken**(`token`): [`TrueLiteral`](TrueLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3644

##### Parameters

###### token

[`TrueKeyword`](../enumerations/SyntaxKind.md#truekeyword)

##### Returns

[`TrueLiteral`](TrueLiteral.md)

#### Call Signature

> **createToken**(`token`): [`FalseLiteral`](FalseLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3645

##### Parameters

###### token

[`FalseKeyword`](../enumerations/SyntaxKind.md#falsekeyword)

##### Returns

[`FalseLiteral`](FalseLiteral.md)

#### Call Signature

> **createToken**\<`TKind`\>(`token`): [`PunctuationToken`](PunctuationToken.md)\<`TKind`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3646

##### Type Parameters

###### TKind

`TKind` *extends* [`PunctuationSyntaxKind`](../type-aliases/PunctuationSyntaxKind.md)

##### Parameters

###### token

`TKind`

##### Returns

[`PunctuationToken`](PunctuationToken.md)\<`TKind`\>

#### Call Signature

> **createToken**\<`TKind`\>(`token`): [`KeywordTypeNode`](KeywordTypeNode.md)\<`TKind`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3647

##### Type Parameters

###### TKind

`TKind` *extends* [`KeywordTypeSyntaxKind`](../type-aliases/KeywordTypeSyntaxKind.md)

##### Parameters

###### token

`TKind`

##### Returns

[`KeywordTypeNode`](KeywordTypeNode.md)\<`TKind`\>

#### Call Signature

> **createToken**\<`TKind`\>(`token`): [`ModifierToken`](ModifierToken.md)\<`TKind`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3648

##### Type Parameters

###### TKind

`TKind` *extends* [`ModifierSyntaxKind`](../type-aliases/ModifierSyntaxKind.md)

##### Parameters

###### token

`TKind`

##### Returns

[`ModifierToken`](ModifierToken.md)\<`TKind`\>

#### Call Signature

> **createToken**\<`TKind`\>(`token`): [`KeywordToken`](KeywordToken.md)\<`TKind`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3649

##### Type Parameters

###### TKind

`TKind` *extends* [`KeywordSyntaxKind`](../type-aliases/KeywordSyntaxKind.md)

##### Parameters

###### token

`TKind`

##### Returns

[`KeywordToken`](KeywordToken.md)\<`TKind`\>

#### Call Signature

> **createToken**\<`TKind`\>(`token`): [`Token`](Token.md)\<`TKind`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3650

##### Type Parameters

###### TKind

`TKind` *extends* [`Unknown`](../enumerations/SyntaxKind.md#unknown) \| [`EndOfFileToken`](../enumerations/SyntaxKind.md#endoffiletoken)

##### Parameters

###### token

`TKind`

##### Returns

[`Token`](Token.md)\<`TKind`\>

***

### createTrue()

> **createTrue**(): [`TrueLiteral`](TrueLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3654

#### Returns

[`TrueLiteral`](TrueLiteral.md)

***

### createTryStatement()

> **createTryStatement**(`tryBlock`, `catchClause`, `finallyBlock`): [`TryStatement`](TryStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3856

#### Parameters

##### tryBlock

[`Block`](Block.md)

##### catchClause

`undefined` | [`CatchClause`](CatchClause.md)

##### finallyBlock

`undefined` | [`Block`](Block.md)

#### Returns

[`TryStatement`](TryStatement.md)

***

### createTupleTypeNode()

> **createTupleTypeNode**(`elements`): [`TupleTypeNode`](TupleTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3707

#### Parameters

##### elements

readonly ([`TypeNode`](TypeNode.md) \| [`NamedTupleMember`](NamedTupleMember.md))[]

#### Returns

[`TupleTypeNode`](TupleTypeNode.md)

***

### createTypeAliasDeclaration()

#### Call Signature

> **createTypeAliasDeclaration**(`modifiers`, `name`, `typeParameters`, `type`): [`TypeAliasDeclaration`](TypeAliasDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3871

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

#### Call Signature

> **createTypeAliasDeclaration**(`decorators`, `modifiers`, `name`, `typeParameters`, `type`): [`TypeAliasDeclaration`](TypeAliasDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8510

##### Parameters

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### createTypeAssertion()

> **createTypeAssertion**(`type`, `expression`): [`TypeAssertion`](TypeAssertion.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3764

#### Parameters

##### type

[`TypeNode`](TypeNode.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`TypeAssertion`](TypeAssertion.md)

***

### createTypeLiteralNode()

> **createTypeLiteralNode**(`members`): [`TypeLiteralNode`](TypeLiteralNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3703

#### Parameters

##### members

`undefined` | readonly [`TypeElement`](TypeElement.md)[]

#### Returns

[`TypeLiteralNode`](TypeLiteralNode.md)

***

### createTypeOfExpression()

> **createTypeOfExpression**(`expression`): [`TypeOfExpression`](TypeOfExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3776

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`TypeOfExpression`](TypeOfExpression.md)

***

### createTypeOperatorNode()

> **createTypeOperatorNode**(`operator`, `type`): [`TypeOperatorNode`](TypeOperatorNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3728

#### Parameters

##### operator

[`KeyOfKeyword`](../enumerations/SyntaxKind.md#keyofkeyword) | [`ReadonlyKeyword`](../enumerations/SyntaxKind.md#readonlykeyword) | [`UniqueKeyword`](../enumerations/SyntaxKind.md#uniquekeyword)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`TypeOperatorNode`](TypeOperatorNode.md)

***

### createTypeParameterDeclaration()

#### Call Signature

> **createTypeParameterDeclaration**(`modifiers`, `name`, `constraint?`, `defaultType?`): [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3662

##### Parameters

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`Identifier`](Identifier.md)

###### constraint?

[`TypeNode`](TypeNode.md)

###### defaultType?

[`TypeNode`](TypeNode.md)

##### Returns

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Call Signature

> **createTypeParameterDeclaration**(`name`, `constraint?`, `defaultType?`): [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8358

##### Parameters

###### name

`string` | [`Identifier`](Identifier.md)

###### constraint?

[`TypeNode`](TypeNode.md)

###### defaultType?

[`TypeNode`](TypeNode.md)

##### Returns

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

##### Deprecated

Use the overload that accepts 'modifiers'

***

### createTypePredicateNode()

> **createTypePredicateNode**(`assertsModifier`, `parameterName`, `type`): [`TypePredicateNode`](TypePredicateNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3693

#### Parameters

##### assertsModifier

`undefined` | [`AssertsKeyword`](../type-aliases/AssertsKeyword.md)

##### parameterName

`string` | [`Identifier`](Identifier.md) | [`ThisTypeNode`](ThisTypeNode.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`TypePredicateNode`](TypePredicateNode.md)

***

### createTypeQueryNode()

> **createTypeQueryNode**(`exprName`, `typeArguments?`): [`TypeQueryNode`](TypeQueryNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3701

#### Parameters

##### exprName

[`EntityName`](../type-aliases/EntityName.md)

##### typeArguments?

readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`TypeQueryNode`](TypeQueryNode.md)

***

### createTypeReferenceNode()

> **createTypeReferenceNode**(`typeName`, `typeArguments?`): [`TypeReferenceNode`](TypeReferenceNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3695

#### Parameters

##### typeName

`string` | [`EntityName`](../type-aliases/EntityName.md)

##### typeArguments?

readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`TypeReferenceNode`](TypeReferenceNode.md)

***

### createUnionTypeNode()

> **createUnionTypeNode**(`types`): [`UnionTypeNode`](UnionTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3715

#### Parameters

##### types

readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`UnionTypeNode`](UnionTypeNode.md)

***

### createUniqueName()

> **createUniqueName**(`text`, `flags?`): [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3635

Create a unique name based on the supplied text.

#### Parameters

##### text

`string`

##### flags?

[`GeneratedIdentifierFlags`](../enumerations/GeneratedIdentifierFlags.md)

#### Returns

[`Identifier`](Identifier.md)

***

### createUniquePrivateName()

> **createUniquePrivateName**(`text?`): [`PrivateIdentifier`](PrivateIdentifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3639

#### Parameters

##### text?

`string`

#### Returns

[`PrivateIdentifier`](PrivateIdentifier.md)

***

### createUnsignedRightShift()

> **createUnsignedRightShift**(`left`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4054

#### Parameters

##### left

[`Expression`](Expression.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### createVariableDeclaration()

> **createVariableDeclaration**(`name`, `exclamationToken?`, `type?`, `initializer?`): [`VariableDeclaration`](VariableDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3859

#### Parameters

##### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

##### exclamationToken?

[`ExclamationToken`](../type-aliases/ExclamationToken.md)

##### type?

[`TypeNode`](TypeNode.md)

##### initializer?

[`Expression`](Expression.md)

#### Returns

[`VariableDeclaration`](VariableDeclaration.md)

***

### createVariableDeclarationList()

> **createVariableDeclarationList**(`declarations`, `flags?`): [`VariableDeclarationList`](VariableDeclarationList.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3861

#### Parameters

##### declarations

readonly [`VariableDeclaration`](VariableDeclaration.md)[]

##### flags?

[`NodeFlags`](../enumerations/NodeFlags.md)

#### Returns

[`VariableDeclarationList`](VariableDeclarationList.md)

***

### createVariableStatement()

> **createVariableStatement**(`modifiers`, `declarationList`): [`VariableStatement`](VariableStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3825

#### Parameters

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### declarationList

[`VariableDeclarationList`](VariableDeclarationList.md) | readonly [`VariableDeclaration`](VariableDeclaration.md)[]

#### Returns

[`VariableStatement`](VariableStatement.md)

***

### createVoidExpression()

> **createVoidExpression**(`expression`): [`VoidExpression`](VoidExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3778

#### Parameters

##### expression

[`Expression`](Expression.md)

#### Returns

[`VoidExpression`](VoidExpression.md)

***

### createVoidZero()

> **createVoidZero**(): [`VoidExpression`](VoidExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4073

#### Returns

[`VoidExpression`](VoidExpression.md)

***

### createWhileStatement()

> **createWhileStatement**(`expression`, `statement`): [`WhileStatement`](WhileStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3834

#### Parameters

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`WhileStatement`](WhileStatement.md)

***

### createWithStatement()

> **createWithStatement**(`expression`, `statement`): [`WithStatement`](WithStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3848

#### Parameters

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`WithStatement`](WithStatement.md)

***

### createYieldExpression()

#### Call Signature

> **createYieldExpression**(`asteriskToken`, `expression`): [`YieldExpression`](YieldExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3800

##### Parameters

###### asteriskToken

[`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### expression

[`Expression`](Expression.md)

##### Returns

[`YieldExpression`](YieldExpression.md)

#### Call Signature

> **createYieldExpression**(`asteriskToken`, `expression`): [`YieldExpression`](YieldExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3801

##### Parameters

###### asteriskToken

`undefined`

###### expression

`undefined` | [`Expression`](Expression.md)

##### Returns

[`YieldExpression`](YieldExpression.md)

***

### getGeneratedNameForNode()

> **getGeneratedNameForNode**(`node`, `flags?`): [`Identifier`](Identifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3637

Create a unique name generated for a node.

#### Parameters

##### node

`undefined` | [`Node`](Node.md)

##### flags?

[`GeneratedIdentifierFlags`](../enumerations/GeneratedIdentifierFlags.md)

#### Returns

[`Identifier`](Identifier.md)

***

### getGeneratedPrivateNameForNode()

> **getGeneratedPrivateNameForNode**(`node`): [`PrivateIdentifier`](PrivateIdentifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3640

#### Parameters

##### node

[`Node`](Node.md)

#### Returns

[`PrivateIdentifier`](PrivateIdentifier.md)

***

### restoreOuterExpressions()

> **restoreOuterExpressions**(`outerExpression`, `innerExpression`, `kinds?`): [`Expression`](Expression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4076

#### Parameters

##### outerExpression

`undefined` | [`Expression`](Expression.md)

##### innerExpression

[`Expression`](Expression.md)

##### kinds?

[`OuterExpressionKinds`](../enumerations/OuterExpressionKinds.md)

#### Returns

[`Expression`](Expression.md)

***

### updateArrayBindingPattern()

> **updateArrayBindingPattern**(`node`, `elements`): [`ArrayBindingPattern`](ArrayBindingPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3741

#### Parameters

##### node

[`ArrayBindingPattern`](ArrayBindingPattern.md)

##### elements

readonly [`ArrayBindingElement`](../type-aliases/ArrayBindingElement.md)[]

#### Returns

[`ArrayBindingPattern`](ArrayBindingPattern.md)

***

### updateArrayLiteralExpression()

> **updateArrayLiteralExpression**(`node`, `elements`): [`ArrayLiteralExpression`](ArrayLiteralExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3745

#### Parameters

##### node

[`ArrayLiteralExpression`](ArrayLiteralExpression.md)

##### elements

readonly [`Expression`](Expression.md)[]

#### Returns

[`ArrayLiteralExpression`](ArrayLiteralExpression.md)

***

### updateArrayTypeNode()

> **updateArrayTypeNode**(`node`, `elementType`): [`ArrayTypeNode`](ArrayTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3706

#### Parameters

##### node

[`ArrayTypeNode`](ArrayTypeNode.md)

##### elementType

[`TypeNode`](TypeNode.md)

#### Returns

[`ArrayTypeNode`](ArrayTypeNode.md)

***

### updateArrowFunction()

> **updateArrowFunction**(`node`, `modifiers`, `typeParameters`, `parameters`, `type`, `equalsGreaterThanToken`, `body`): [`ArrowFunction`](ArrowFunction.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3771

#### Parameters

##### node

[`ArrowFunction`](ArrowFunction.md)

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### equalsGreaterThanToken

[`EqualsGreaterThanToken`](../type-aliases/EqualsGreaterThanToken.md)

##### body

[`ConciseBody`](../type-aliases/ConciseBody.md)

#### Returns

[`ArrowFunction`](ArrowFunction.md)

***

### updateAsExpression()

> **updateAsExpression**(`node`, `expression`, `type`): [`AsExpression`](AsExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3811

#### Parameters

##### node

[`AsExpression`](AsExpression.md)

##### expression

[`Expression`](Expression.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`AsExpression`](AsExpression.md)

***

### updateAssertClause()

> **updateAssertClause**(`node`, `elements`, `multiLine?`): [`AssertClause`](AssertClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3890

#### Parameters

##### node

[`AssertClause`](AssertClause.md)

##### elements

[`NodeArray`](NodeArray.md)\<[`AssertEntry`](AssertEntry.md)\>

##### multiLine?

`boolean`

#### Returns

[`AssertClause`](AssertClause.md)

***

### updateAssertEntry()

> **updateAssertEntry**(`node`, `name`, `value`): [`AssertEntry`](AssertEntry.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3892

#### Parameters

##### node

[`AssertEntry`](AssertEntry.md)

##### name

[`AssertionKey`](../type-aliases/AssertionKey.md)

##### value

[`Expression`](Expression.md)

#### Returns

[`AssertEntry`](AssertEntry.md)

***

### updateAwaitExpression()

> **updateAwaitExpression**(`node`, `expression`): [`AwaitExpression`](AwaitExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3781

#### Parameters

##### node

[`AwaitExpression`](AwaitExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`AwaitExpression`](AwaitExpression.md)

***

### updateBinaryExpression()

> **updateBinaryExpression**(`node`, `left`, `operator`, `right`): [`BinaryExpression`](BinaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3787

#### Parameters

##### node

[`BinaryExpression`](BinaryExpression.md)

##### left

[`Expression`](Expression.md)

##### operator

[`BinaryOperatorToken`](../type-aliases/BinaryOperatorToken.md) | [`BinaryOperator`](../type-aliases/BinaryOperator.md)

##### right

[`Expression`](Expression.md)

#### Returns

[`BinaryExpression`](BinaryExpression.md)

***

### updateBindingElement()

> **updateBindingElement**(`node`, `dotDotDotToken`, `propertyName`, `name`, `initializer`): [`BindingElement`](BindingElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3743

#### Parameters

##### node

[`BindingElement`](BindingElement.md)

##### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

##### propertyName

`undefined` | [`PropertyName`](../type-aliases/PropertyName.md)

##### name

[`BindingName`](../type-aliases/BindingName.md)

##### initializer

`undefined` | [`Expression`](Expression.md)

#### Returns

[`BindingElement`](BindingElement.md)

***

### updateBlock()

> **updateBlock**(`node`, `statements`): [`Block`](Block.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3824

#### Parameters

##### node

[`Block`](Block.md)

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`Block`](Block.md)

***

### updateBreakStatement()

> **updateBreakStatement**(`node`, `label`): [`BreakStatement`](BreakStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3845

#### Parameters

##### node

[`BreakStatement`](BreakStatement.md)

##### label

`undefined` | [`Identifier`](Identifier.md)

#### Returns

[`BreakStatement`](BreakStatement.md)

***

### updateBundle()

> **updateBundle**(`node`, `sourceFiles`, `prepends?`): [`Bundle`](Bundle.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4035

#### Parameters

##### node

[`Bundle`](Bundle.md)

##### sourceFiles

readonly [`SourceFile`](SourceFile.md)[]

##### prepends?

readonly ([`InputFiles`](InputFiles.md) \| [`UnparsedSource`](UnparsedSource.md))[]

#### Returns

[`Bundle`](Bundle.md)

***

### updateCallChain()

> **updateCallChain**(`node`, `expression`, `questionDotToken`, `typeArguments`, `argumentsArray`): [`CallChain`](CallChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3759

#### Parameters

##### node

[`CallChain`](CallChain.md)

##### expression

[`Expression`](Expression.md)

##### questionDotToken

`undefined` | [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### argumentsArray

readonly [`Expression`](Expression.md)[]

#### Returns

[`CallChain`](CallChain.md)

***

### updateCallExpression()

> **updateCallExpression**(`node`, `expression`, `typeArguments`, `argumentsArray`): [`CallExpression`](CallExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3757

#### Parameters

##### node

[`CallExpression`](CallExpression.md)

##### expression

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### argumentsArray

readonly [`Expression`](Expression.md)[]

#### Returns

[`CallExpression`](CallExpression.md)

***

### updateCallSignature()

> **updateCallSignature**(`node`, `typeParameters`, `parameters`, `type`): [`CallSignatureDeclaration`](CallSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3683

#### Parameters

##### node

[`CallSignatureDeclaration`](CallSignatureDeclaration.md)

##### typeParameters

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

##### parameters

[`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`CallSignatureDeclaration`](CallSignatureDeclaration.md)

***

### updateCaseBlock()

> **updateCaseBlock**(`node`, `clauses`): [`CaseBlock`](CaseBlock.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3880

#### Parameters

##### node

[`CaseBlock`](CaseBlock.md)

##### clauses

readonly [`CaseOrDefaultClause`](../type-aliases/CaseOrDefaultClause.md)[]

#### Returns

[`CaseBlock`](CaseBlock.md)

***

### updateCaseClause()

> **updateCaseClause**(`node`, `expression`, `statements`): [`CaseClause`](CaseClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4012

#### Parameters

##### node

[`CaseClause`](CaseClause.md)

##### expression

[`Expression`](Expression.md)

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`CaseClause`](CaseClause.md)

***

### updateCatchClause()

> **updateCatchClause**(`node`, `variableDeclaration`, `block`): [`CatchClause`](CatchClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4018

#### Parameters

##### node

[`CatchClause`](CatchClause.md)

##### variableDeclaration

`undefined` | [`VariableDeclaration`](VariableDeclaration.md)

##### block

[`Block`](Block.md)

#### Returns

[`CatchClause`](CatchClause.md)

***

### updateClassDeclaration()

#### Call Signature

> **updateClassDeclaration**(`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](ClassDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3866

##### Parameters

###### node

[`ClassDeclaration`](ClassDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`undefined` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassDeclaration`](ClassDeclaration.md)

#### Call Signature

> **updateClassDeclaration**(`node`, `decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassDeclaration`](ClassDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8498

##### Parameters

###### node

[`ClassDeclaration`](ClassDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`undefined` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassDeclaration`](ClassDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateClassExpression()

#### Call Signature

> **updateClassExpression**(`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassExpression`](ClassExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3806

##### Parameters

###### node

[`ClassExpression`](ClassExpression.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`undefined` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassExpression`](ClassExpression.md)

#### Call Signature

> **updateClassExpression**(`node`, `decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`ClassExpression`](ClassExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8482

##### Parameters

###### node

[`ClassExpression`](ClassExpression.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`undefined` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`ClassElement`](ClassElement.md)[]

##### Returns

[`ClassExpression`](ClassExpression.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateClassStaticBlockDeclaration()

#### Call Signature

> **updateClassStaticBlockDeclaration**(`node`, `body`): [`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3691

##### Parameters

###### node

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

###### body

[`Block`](Block.md)

##### Returns

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

#### Call Signature

> **updateClassStaticBlockDeclaration**(`node`, `decorators`, `modifiers`, `body`): [`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8474

##### Parameters

###### node

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### body

[`Block`](Block.md)

##### Returns

[`ClassStaticBlockDeclaration`](ClassStaticBlockDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateCommaListExpression()

> **updateCommaListExpression**(`node`, `elements`): [`CommaListExpression`](CommaListExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4033

#### Parameters

##### node

[`CommaListExpression`](CommaListExpression.md)

##### elements

readonly [`Expression`](Expression.md)[]

#### Returns

[`CommaListExpression`](CommaListExpression.md)

***

### updateComputedPropertyName()

> **updateComputedPropertyName**(`node`, `expression`): [`ComputedPropertyName`](ComputedPropertyName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3661

#### Parameters

##### node

[`ComputedPropertyName`](ComputedPropertyName.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`ComputedPropertyName`](ComputedPropertyName.md)

***

### updateConditionalExpression()

> **updateConditionalExpression**(`node`, `condition`, `questionToken`, `whenTrue`, `colonToken`, `whenFalse`): [`ConditionalExpression`](ConditionalExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3789

#### Parameters

##### node

[`ConditionalExpression`](ConditionalExpression.md)

##### condition

[`Expression`](Expression.md)

##### questionToken

[`QuestionToken`](../type-aliases/QuestionToken.md)

##### whenTrue

[`Expression`](Expression.md)

##### colonToken

[`ColonToken`](../type-aliases/ColonToken.md)

##### whenFalse

[`Expression`](Expression.md)

#### Returns

[`ConditionalExpression`](ConditionalExpression.md)

***

### updateConditionalTypeNode()

> **updateConditionalTypeNode**(`node`, `checkType`, `extendsType`, `trueType`, `falseType`): [`ConditionalTypeNode`](ConditionalTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3720

#### Parameters

##### node

[`ConditionalTypeNode`](ConditionalTypeNode.md)

##### checkType

[`TypeNode`](TypeNode.md)

##### extendsType

[`TypeNode`](TypeNode.md)

##### trueType

[`TypeNode`](TypeNode.md)

##### falseType

[`TypeNode`](TypeNode.md)

#### Returns

[`ConditionalTypeNode`](ConditionalTypeNode.md)

***

### updateConstructorDeclaration()

#### Call Signature

> **updateConstructorDeclaration**(`node`, `modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](ConstructorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3677

##### Parameters

###### node

[`ConstructorDeclaration`](ConstructorDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`ConstructorDeclaration`](ConstructorDeclaration.md)

#### Call Signature

> **updateConstructorDeclaration**(`node`, `decorators`, `modifiers`, `parameters`, `body`): [`ConstructorDeclaration`](ConstructorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8442

##### Parameters

###### node

[`ConstructorDeclaration`](ConstructorDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`ConstructorDeclaration`](ConstructorDeclaration.md)

##### Deprecated

This node does not support Decorators. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateConstructorTypeNode()

#### Call Signature

> **updateConstructorTypeNode**(`node`, `modifiers`, `typeParameters`, `parameters`, `type`): [`ConstructorTypeNode`](ConstructorTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3700

##### Parameters

###### node

[`ConstructorTypeNode`](ConstructorTypeNode.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### typeParameters

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

###### parameters

[`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`ConstructorTypeNode`](ConstructorTypeNode.md)

#### Call Signature

> **updateConstructorTypeNode**(`node`, `typeParameters`, `parameters`, `type`): [`ConstructorTypeNode`](ConstructorTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8343

##### Parameters

###### node

[`ConstructorTypeNode`](ConstructorTypeNode.md)

###### typeParameters

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

###### parameters

[`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`ConstructorTypeNode`](ConstructorTypeNode.md)

##### Deprecated

Use the overload that accepts 'modifiers'

***

### updateConstructSignature()

> **updateConstructSignature**(`node`, `typeParameters`, `parameters`, `type`): [`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3685

#### Parameters

##### node

[`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

##### typeParameters

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

##### parameters

[`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`ConstructSignatureDeclaration`](ConstructSignatureDeclaration.md)

***

### updateContinueStatement()

> **updateContinueStatement**(`node`, `label`): [`ContinueStatement`](ContinueStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3843

#### Parameters

##### node

[`ContinueStatement`](ContinueStatement.md)

##### label

`undefined` | [`Identifier`](Identifier.md)

#### Returns

[`ContinueStatement`](ContinueStatement.md)

***

### updateDecorator()

> **updateDecorator**(`node`, `expression`): [`Decorator`](Decorator.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3667

#### Parameters

##### node

[`Decorator`](Decorator.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`Decorator`](Decorator.md)

***

### updateDefaultClause()

> **updateDefaultClause**(`node`, `statements`): [`DefaultClause`](DefaultClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4014

#### Parameters

##### node

[`DefaultClause`](DefaultClause.md)

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`DefaultClause`](DefaultClause.md)

***

### updateDeleteExpression()

> **updateDeleteExpression**(`node`, `expression`): [`DeleteExpression`](DeleteExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3775

#### Parameters

##### node

[`DeleteExpression`](DeleteExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`DeleteExpression`](DeleteExpression.md)

***

### updateDoStatement()

> **updateDoStatement**(`node`, `statement`, `expression`): [`DoStatement`](DoStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3833

#### Parameters

##### node

[`DoStatement`](DoStatement.md)

##### statement

[`Statement`](Statement.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`DoStatement`](DoStatement.md)

***

### updateElementAccessChain()

> **updateElementAccessChain**(`node`, `expression`, `questionDotToken`, `argumentExpression`): [`ElementAccessChain`](ElementAccessChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3755

#### Parameters

##### node

[`ElementAccessChain`](ElementAccessChain.md)

##### expression

[`Expression`](Expression.md)

##### questionDotToken

`undefined` | [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

##### argumentExpression

[`Expression`](Expression.md)

#### Returns

[`ElementAccessChain`](ElementAccessChain.md)

***

### updateElementAccessExpression()

> **updateElementAccessExpression**(`node`, `expression`, `argumentExpression`): [`ElementAccessExpression`](ElementAccessExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3753

#### Parameters

##### node

[`ElementAccessExpression`](ElementAccessExpression.md)

##### expression

[`Expression`](Expression.md)

##### argumentExpression

[`Expression`](Expression.md)

#### Returns

[`ElementAccessExpression`](ElementAccessExpression.md)

***

### updateEnumDeclaration()

#### Call Signature

> **updateEnumDeclaration**(`node`, `modifiers`, `name`, `members`): [`EnumDeclaration`](EnumDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3874

##### Parameters

###### node

[`EnumDeclaration`](EnumDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### members

readonly [`EnumMember`](EnumMember.md)[]

##### Returns

[`EnumDeclaration`](EnumDeclaration.md)

#### Call Signature

> **updateEnumDeclaration**(`node`, `decorators`, `modifiers`, `name`, `members`): [`EnumDeclaration`](EnumDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8522

##### Parameters

###### node

[`EnumDeclaration`](EnumDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### members

readonly [`EnumMember`](EnumMember.md)[]

##### Returns

[`EnumDeclaration`](EnumDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateEnumMember()

> **updateEnumMember**(`node`, `name`, `initializer`): [`EnumMember`](EnumMember.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4026

#### Parameters

##### node

[`EnumMember`](EnumMember.md)

##### name

[`PropertyName`](../type-aliases/PropertyName.md)

##### initializer

`undefined` | [`Expression`](Expression.md)

#### Returns

[`EnumMember`](EnumMember.md)

***

### updateEtsComponentExpression()

> **updateEtsComponentExpression**(`node`, `name`, `argumentExpression`, `body`): [`EtsComponentExpression`](EtsComponentExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3773

#### Parameters

##### node

[`EtsComponentExpression`](EtsComponentExpression.md)

##### name

`undefined` | [`Expression`](Expression.md)

##### argumentExpression

`undefined` | [`NodeArray`](NodeArray.md)\<[`Expression`](Expression.md)\> | [`Expression`](Expression.md)[]

##### body

`undefined` | [`Block`](Block.md)

#### Returns

[`EtsComponentExpression`](EtsComponentExpression.md)

***

### updateExportAssignment()

#### Call Signature

> **updateExportAssignment**(`node`, `modifiers`, `expression`): [`ExportAssignment`](ExportAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3904

##### Parameters

###### node

[`ExportAssignment`](ExportAssignment.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### expression

[`Expression`](Expression.md)

##### Returns

[`ExportAssignment`](ExportAssignment.md)

#### Call Signature

> **updateExportAssignment**(`node`, `decorators`, `modifiers`, `expression`): [`ExportAssignment`](ExportAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8554

##### Parameters

###### node

[`ExportAssignment`](ExportAssignment.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### expression

[`Expression`](Expression.md)

##### Returns

[`ExportAssignment`](ExportAssignment.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateExportDeclaration()

#### Call Signature

> **updateExportDeclaration**(`node`, `modifiers`, `isTypeOnly`, `exportClause`, `moduleSpecifier`, `assertClause`): [`ExportDeclaration`](ExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3906

##### Parameters

###### node

[`ExportDeclaration`](ExportDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### exportClause

`undefined` | [`NamedExportBindings`](../type-aliases/NamedExportBindings.md)

###### moduleSpecifier

`undefined` | [`Expression`](Expression.md)

###### assertClause

`undefined` | [`AssertClause`](AssertClause.md)

##### Returns

[`ExportDeclaration`](ExportDeclaration.md)

#### Call Signature

> **updateExportDeclaration**(`node`, `decorators`, `modifiers`, `isTypeOnly`, `exportClause`, `moduleSpecifier`, `assertClause`): [`ExportDeclaration`](ExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8562

##### Parameters

###### node

[`ExportDeclaration`](ExportDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### exportClause

`undefined` | [`NamedExportBindings`](../type-aliases/NamedExportBindings.md)

###### moduleSpecifier

`undefined` | [`Expression`](Expression.md)

###### assertClause

`undefined` | [`AssertClause`](AssertClause.md)

##### Returns

[`ExportDeclaration`](ExportDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateExportSpecifier()

> **updateExportSpecifier**(`node`, `isTypeOnly`, `propertyName`, `name`): [`ExportSpecifier`](ExportSpecifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3910

#### Parameters

##### node

[`ExportSpecifier`](ExportSpecifier.md)

##### isTypeOnly

`boolean`

##### propertyName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`ExportSpecifier`](ExportSpecifier.md)

***

### updateExpressionStatement()

> **updateExpressionStatement**(`node`, `expression`): [`ExpressionStatement`](ExpressionStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3829

#### Parameters

##### node

[`ExpressionStatement`](ExpressionStatement.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`ExpressionStatement`](ExpressionStatement.md)

***

### updateExpressionWithTypeArguments()

> **updateExpressionWithTypeArguments**(`node`, `expression`, `typeArguments`): [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3809

#### Parameters

##### node

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

##### expression

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)

***

### updateExternalModuleReference()

> **updateExternalModuleReference**(`node`, `expression`): [`ExternalModuleReference`](ExternalModuleReference.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3912

#### Parameters

##### node

[`ExternalModuleReference`](ExternalModuleReference.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`ExternalModuleReference`](ExternalModuleReference.md)

***

### updateForInStatement()

> **updateForInStatement**(`node`, `initializer`, `expression`, `statement`): [`ForInStatement`](ForInStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3839

#### Parameters

##### node

[`ForInStatement`](ForInStatement.md)

##### initializer

[`ForInitializer`](../type-aliases/ForInitializer.md)

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`ForInStatement`](ForInStatement.md)

***

### updateForOfStatement()

> **updateForOfStatement**(`node`, `awaitModifier`, `initializer`, `expression`, `statement`): [`ForOfStatement`](ForOfStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3841

#### Parameters

##### node

[`ForOfStatement`](ForOfStatement.md)

##### awaitModifier

`undefined` | [`AwaitKeyword`](../type-aliases/AwaitKeyword.md)

##### initializer

[`ForInitializer`](../type-aliases/ForInitializer.md)

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`ForOfStatement`](ForOfStatement.md)

***

### updateForStatement()

> **updateForStatement**(`node`, `initializer`, `condition`, `incrementor`, `statement`): [`ForStatement`](ForStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3837

#### Parameters

##### node

[`ForStatement`](ForStatement.md)

##### initializer

`undefined` | [`ForInitializer`](../type-aliases/ForInitializer.md)

##### condition

`undefined` | [`Expression`](Expression.md)

##### incrementor

`undefined` | [`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`ForStatement`](ForStatement.md)

***

### updateFunctionDeclaration()

#### Call Signature

> **updateFunctionDeclaration**(`node`, `modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](FunctionDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3864

##### Parameters

###### node

[`FunctionDeclaration`](FunctionDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

`undefined` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`FunctionDeclaration`](FunctionDeclaration.md)

#### Call Signature

> **updateFunctionDeclaration**(`node`, `decorators`, `modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](FunctionDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8490

##### Parameters

###### node

[`FunctionDeclaration`](FunctionDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

`undefined` | [`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`FunctionDeclaration`](FunctionDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateFunctionExpression()

> **updateFunctionExpression**(`node`, `modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionExpression`](FunctionExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3769

#### Parameters

##### node

[`FunctionExpression`](FunctionExpression.md)

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

##### name

`undefined` | [`Identifier`](Identifier.md)

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### body

[`Block`](Block.md)

#### Returns

[`FunctionExpression`](FunctionExpression.md)

***

### updateFunctionTypeNode()

> **updateFunctionTypeNode**(`node`, `typeParameters`, `parameters`, `type`): [`FunctionTypeNode`](FunctionTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3698

#### Parameters

##### node

[`FunctionTypeNode`](FunctionTypeNode.md)

##### typeParameters

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

##### parameters

[`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`FunctionTypeNode`](FunctionTypeNode.md)

***

### updateGetAccessorDeclaration()

#### Call Signature

> **updateGetAccessorDeclaration**(`node`, `modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](GetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3679

##### Parameters

###### node

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

[`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

#### Call Signature

> **updateGetAccessorDeclaration**(`node`, `decorators`, `modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](GetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8450

##### Parameters

###### node

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`GetAccessorDeclaration`](GetAccessorDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateHeritageClause()

> **updateHeritageClause**(`node`, `types`): [`HeritageClause`](HeritageClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4016

#### Parameters

##### node

[`HeritageClause`](HeritageClause.md)

##### types

readonly [`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md)[]

#### Returns

[`HeritageClause`](HeritageClause.md)

***

### updateIfStatement()

> **updateIfStatement**(`node`, `expression`, `thenStatement`, `elseStatement`): [`IfStatement`](IfStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3831

#### Parameters

##### node

[`IfStatement`](IfStatement.md)

##### expression

[`Expression`](Expression.md)

##### thenStatement

[`Statement`](Statement.md)

##### elseStatement

`undefined` | [`Statement`](Statement.md)

#### Returns

[`IfStatement`](IfStatement.md)

***

### updateImportClause()

> **updateImportClause**(`node`, `isTypeOnly`, `name`, `namedBindings`): [`ImportClause`](ImportClause.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3888

#### Parameters

##### node

[`ImportClause`](ImportClause.md)

##### isTypeOnly

`boolean`

##### name

`undefined` | [`Identifier`](Identifier.md)

##### namedBindings

`undefined` | [`NamedImportBindings`](../type-aliases/NamedImportBindings.md)

#### Returns

[`ImportClause`](ImportClause.md)

***

### updateImportDeclaration()

#### Call Signature

> **updateImportDeclaration**(`node`, `modifiers`, `importClause`, `moduleSpecifier`, `assertClause`): [`ImportDeclaration`](ImportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3886

##### Parameters

###### node

[`ImportDeclaration`](ImportDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### importClause

`undefined` | [`ImportClause`](ImportClause.md)

###### moduleSpecifier

[`Expression`](Expression.md)

###### assertClause

`undefined` | [`AssertClause`](AssertClause.md)

##### Returns

[`ImportDeclaration`](ImportDeclaration.md)

#### Call Signature

> **updateImportDeclaration**(`node`, `decorators`, `modifiers`, `importClause`, `moduleSpecifier`, `assertClause`): [`ImportDeclaration`](ImportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8546

##### Parameters

###### node

[`ImportDeclaration`](ImportDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### importClause

`undefined` | [`ImportClause`](ImportClause.md)

###### moduleSpecifier

[`Expression`](Expression.md)

###### assertClause

`undefined` | [`AssertClause`](AssertClause.md)

##### Returns

[`ImportDeclaration`](ImportDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateImportEqualsDeclaration()

#### Call Signature

> **updateImportEqualsDeclaration**(`node`, `modifiers`, `isTypeOnly`, `name`, `moduleReference`): [`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3884

##### Parameters

###### node

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### name

[`Identifier`](Identifier.md)

###### moduleReference

[`ModuleReference`](../type-aliases/ModuleReference.md)

##### Returns

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

#### Call Signature

> **updateImportEqualsDeclaration**(`node`, `decorators`, `modifiers`, `isTypeOnly`, `name`, `moduleReference`): [`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8538

##### Parameters

###### node

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### isTypeOnly

`boolean`

###### name

[`Identifier`](Identifier.md)

###### moduleReference

[`ModuleReference`](../type-aliases/ModuleReference.md)

##### Returns

[`ImportEqualsDeclaration`](ImportEqualsDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateImportSpecifier()

> **updateImportSpecifier**(`node`, `isTypeOnly`, `propertyName`, `name`): [`ImportSpecifier`](ImportSpecifier.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3902

#### Parameters

##### node

[`ImportSpecifier`](ImportSpecifier.md)

##### isTypeOnly

`boolean`

##### propertyName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`ImportSpecifier`](ImportSpecifier.md)

***

### updateImportTypeAssertionContainer()

> **updateImportTypeAssertionContainer**(`node`, `clause`, `multiLine?`): [`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3894

#### Parameters

##### node

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

##### clause

[`AssertClause`](AssertClause.md)

##### multiLine?

`boolean`

#### Returns

[`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

***

### updateImportTypeNode()

#### Call Signature

> **updateImportTypeNode**(`node`, `argument`, `assertions`, `qualifier`, `typeArguments`, `isTypeOf?`): [`ImportTypeNode`](ImportTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3724

##### Parameters

###### node

[`ImportTypeNode`](ImportTypeNode.md)

###### argument

[`TypeNode`](TypeNode.md)

###### assertions

`undefined` | [`ImportTypeAssertionContainer`](ImportTypeAssertionContainer.md)

###### qualifier

`undefined` | [`EntityName`](../type-aliases/EntityName.md)

###### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

###### isTypeOf?

`boolean`

##### Returns

[`ImportTypeNode`](ImportTypeNode.md)

#### Call Signature

> **updateImportTypeNode**(`node`, `argument`, `qualifier`, `typeArguments`, `isTypeOf?`): [`ImportTypeNode`](ImportTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8352

##### Parameters

###### node

[`ImportTypeNode`](ImportTypeNode.md)

###### argument

[`TypeNode`](TypeNode.md)

###### qualifier

`undefined` | [`EntityName`](../type-aliases/EntityName.md)

###### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

###### isTypeOf?

`boolean`

##### Returns

[`ImportTypeNode`](ImportTypeNode.md)

##### Deprecated

Use the overload that accepts 'assertions'

***

### updateIndexedAccessTypeNode()

> **updateIndexedAccessTypeNode**(`node`, `objectType`, `indexType`): [`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3731

#### Parameters

##### node

[`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

##### objectType

[`TypeNode`](TypeNode.md)

##### indexType

[`TypeNode`](TypeNode.md)

#### Returns

[`IndexedAccessTypeNode`](IndexedAccessTypeNode.md)

***

### updateIndexSignature()

#### Call Signature

> **updateIndexSignature**(`node`, `modifiers`, `parameters`, `type`): [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3687

##### Parameters

###### node

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

#### Call Signature

> **updateIndexSignature**(`node`, `decorators`, `modifiers`, `parameters`, `type`): [`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8466

##### Parameters

###### node

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`IndexSignatureDeclaration`](IndexSignatureDeclaration.md)

##### Deprecated

Decorators and modifiers are no longer supported for this function. Callers should use an overload that does not accept the `decorators` and `modifiers` parameters.

***

### updateInferTypeNode()

> **updateInferTypeNode**(`node`, `typeParameter`): [`InferTypeNode`](InferTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3722

#### Parameters

##### node

[`InferTypeNode`](InferTypeNode.md)

##### typeParameter

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Returns

[`InferTypeNode`](InferTypeNode.md)

***

### updateInterfaceDeclaration()

#### Call Signature

> **updateInterfaceDeclaration**(`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`InterfaceDeclaration`](InterfaceDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3870

##### Parameters

###### node

[`InterfaceDeclaration`](InterfaceDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`TypeElement`](TypeElement.md)[]

##### Returns

[`InterfaceDeclaration`](InterfaceDeclaration.md)

#### Call Signature

> **updateInterfaceDeclaration**(`node`, `decorators`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`InterfaceDeclaration`](InterfaceDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8506

##### Parameters

###### node

[`InterfaceDeclaration`](InterfaceDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

###### members

readonly [`TypeElement`](TypeElement.md)[]

##### Returns

[`InterfaceDeclaration`](InterfaceDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateIntersectionTypeNode()

> **updateIntersectionTypeNode**(`node`, `types`): [`IntersectionTypeNode`](IntersectionTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3718

#### Parameters

##### node

[`IntersectionTypeNode`](IntersectionTypeNode.md)

##### types

[`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

#### Returns

[`IntersectionTypeNode`](IntersectionTypeNode.md)

***

### updateJSDocAugmentsTag()

> **updateJSDocAugmentsTag**(`node`, `tagName`, `className`, `comment`): [`JSDocAugmentsTag`](JSDocAugmentsTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3964

#### Parameters

##### node

[`JSDocAugmentsTag`](JSDocAugmentsTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### className

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAugmentsTag`](JSDocAugmentsTag.md)

***

### updateJSDocAuthorTag()

> **updateJSDocAuthorTag**(`node`, `tagName`, `comment`): [`JSDocAuthorTag`](JSDocAuthorTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3968

#### Parameters

##### node

[`JSDocAuthorTag`](JSDocAuthorTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocAuthorTag`](JSDocAuthorTag.md)

***

### updateJSDocCallbackTag()

> **updateJSDocCallbackTag**(`node`, `tagName`, `typeExpression`, `fullName`, `comment`): [`JSDocCallbackTag`](JSDocCallbackTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3962

#### Parameters

##### node

[`JSDocCallbackTag`](JSDocCallbackTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocSignature`](JSDocSignature.md)

##### fullName

`undefined` | [`Identifier`](Identifier.md) | [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocCallbackTag`](JSDocCallbackTag.md)

***

### updateJSDocClassTag()

> **updateJSDocClassTag**(`node`, `tagName`, `comment`): [`JSDocClassTag`](JSDocClassTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3970

#### Parameters

##### node

[`JSDocClassTag`](JSDocClassTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocClassTag`](JSDocClassTag.md)

***

### updateJSDocComment()

> **updateJSDocComment**(`node`, `comment`, `tags`): [`JSDoc`](JSDoc.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3988

#### Parameters

##### node

[`JSDoc`](JSDoc.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

##### tags

`undefined` | readonly [`JSDocTag`](JSDocTag.md)[]

#### Returns

[`JSDoc`](JSDoc.md)

***

### updateJSDocDeprecatedTag()

> **updateJSDocDeprecatedTag**(`node`, `tagName`, `comment?`): [`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3982

#### Parameters

##### node

[`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

##### tagName

[`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocDeprecatedTag`](JSDocDeprecatedTag.md)

***

### updateJSDocEnumTag()

> **updateJSDocEnumTag**(`node`, `tagName`, `typeExpression`, `comment`): [`JSDocEnumTag`](JSDocEnumTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3960

#### Parameters

##### node

[`JSDocEnumTag`](JSDocEnumTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocEnumTag`](JSDocEnumTag.md)

***

### updateJSDocFunctionType()

> **updateJSDocFunctionType**(`node`, `parameters`, `type`): [`JSDocFunctionType`](JSDocFunctionType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3922

#### Parameters

##### node

[`JSDocFunctionType`](JSDocFunctionType.md)

##### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`JSDocFunctionType`](JSDocFunctionType.md)

***

### updateJSDocImplementsTag()

> **updateJSDocImplementsTag**(`node`, `tagName`, `className`, `comment`): [`JSDocImplementsTag`](JSDocImplementsTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3966

#### Parameters

##### node

[`JSDocImplementsTag`](JSDocImplementsTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### className

[`ExpressionWithTypeArguments`](ExpressionWithTypeArguments.md) & `object`

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocImplementsTag`](JSDocImplementsTag.md)

***

### updateJSDocLink()

> **updateJSDocLink**(`node`, `name`, `text`): [`JSDocLink`](JSDocLink.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3934

#### Parameters

##### node

[`JSDocLink`](JSDocLink.md)

##### name

`undefined` | [`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### text

`string`

#### Returns

[`JSDocLink`](JSDocLink.md)

***

### updateJSDocLinkCode()

> **updateJSDocLinkCode**(`node`, `name`, `text`): [`JSDocLinkCode`](JSDocLinkCode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3936

#### Parameters

##### node

[`JSDocLinkCode`](JSDocLinkCode.md)

##### name

`undefined` | [`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### text

`string`

#### Returns

[`JSDocLinkCode`](JSDocLinkCode.md)

***

### updateJSDocLinkPlain()

> **updateJSDocLinkPlain**(`node`, `name`, `text`): [`JSDocLinkPlain`](JSDocLinkPlain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3938

#### Parameters

##### node

[`JSDocLinkPlain`](JSDocLinkPlain.md)

##### name

`undefined` | [`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### text

`string`

#### Returns

[`JSDocLinkPlain`](JSDocLinkPlain.md)

***

### updateJSDocMemberName()

> **updateJSDocMemberName**(`node`, `left`, `right`): [`JSDocMemberName`](JSDocMemberName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3932

#### Parameters

##### node

[`JSDocMemberName`](JSDocMemberName.md)

##### left

[`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

##### right

[`Identifier`](Identifier.md)

#### Returns

[`JSDocMemberName`](JSDocMemberName.md)

***

### updateJSDocNamepathType()

> **updateJSDocNamepathType**(`node`, `type`): [`JSDocNamepathType`](JSDocNamepathType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3926

#### Parameters

##### node

[`JSDocNamepathType`](JSDocNamepathType.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNamepathType`](JSDocNamepathType.md)

***

### updateJSDocNameReference()

> **updateJSDocNameReference**(`node`, `name`): [`JSDocNameReference`](JSDocNameReference.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3930

#### Parameters

##### node

[`JSDocNameReference`](JSDocNameReference.md)

##### name

[`EntityName`](../type-aliases/EntityName.md) | [`JSDocMemberName`](JSDocMemberName.md)

#### Returns

[`JSDocNameReference`](JSDocNameReference.md)

***

### updateJSDocNonNullableType()

> **updateJSDocNonNullableType**(`node`, `type`): [`JSDocNonNullableType`](JSDocNonNullableType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3916

#### Parameters

##### node

[`JSDocNonNullableType`](JSDocNonNullableType.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNonNullableType`](JSDocNonNullableType.md)

***

### updateJSDocNullableType()

> **updateJSDocNullableType**(`node`, `type`): [`JSDocNullableType`](JSDocNullableType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3918

#### Parameters

##### node

[`JSDocNullableType`](JSDocNullableType.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocNullableType`](JSDocNullableType.md)

***

### updateJSDocOptionalType()

> **updateJSDocOptionalType**(`node`, `type`): [`JSDocOptionalType`](JSDocOptionalType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3920

#### Parameters

##### node

[`JSDocOptionalType`](JSDocOptionalType.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocOptionalType`](JSDocOptionalType.md)

***

### updateJSDocOverrideTag()

> **updateJSDocOverrideTag**(`node`, `tagName`, `comment?`): [`JSDocOverrideTag`](JSDocOverrideTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3984

#### Parameters

##### node

[`JSDocOverrideTag`](JSDocOverrideTag.md)

##### tagName

[`Identifier`](Identifier.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocOverrideTag`](JSDocOverrideTag.md)

***

### updateJSDocParameterTag()

> **updateJSDocParameterTag**(`node`, `tagName`, `name`, `isBracketed`, `typeExpression`, `isNameFirst`, `comment`): [`JSDocParameterTag`](JSDocParameterTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3948

#### Parameters

##### node

[`JSDocParameterTag`](JSDocParameterTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`EntityName`](../type-aliases/EntityName.md)

##### isBracketed

`boolean`

##### typeExpression

`undefined` | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### isNameFirst

`boolean`

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocParameterTag`](JSDocParameterTag.md)

***

### updateJSDocPrivateTag()

> **updateJSDocPrivateTag**(`node`, `tagName`, `comment`): [`JSDocPrivateTag`](JSDocPrivateTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3974

#### Parameters

##### node

[`JSDocPrivateTag`](JSDocPrivateTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPrivateTag`](JSDocPrivateTag.md)

***

### updateJSDocPropertyTag()

> **updateJSDocPropertyTag**(`node`, `tagName`, `name`, `isBracketed`, `typeExpression`, `isNameFirst`, `comment`): [`JSDocPropertyTag`](JSDocPropertyTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3950

#### Parameters

##### node

[`JSDocPropertyTag`](JSDocPropertyTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### name

[`EntityName`](../type-aliases/EntityName.md)

##### isBracketed

`boolean`

##### typeExpression

`undefined` | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### isNameFirst

`boolean`

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPropertyTag`](JSDocPropertyTag.md)

***

### updateJSDocProtectedTag()

> **updateJSDocProtectedTag**(`node`, `tagName`, `comment`): [`JSDocProtectedTag`](JSDocProtectedTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3976

#### Parameters

##### node

[`JSDocProtectedTag`](JSDocProtectedTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocProtectedTag`](JSDocProtectedTag.md)

***

### updateJSDocPublicTag()

> **updateJSDocPublicTag**(`node`, `tagName`, `comment`): [`JSDocPublicTag`](JSDocPublicTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3972

#### Parameters

##### node

[`JSDocPublicTag`](JSDocPublicTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocPublicTag`](JSDocPublicTag.md)

***

### updateJSDocReadonlyTag()

> **updateJSDocReadonlyTag**(`node`, `tagName`, `comment`): [`JSDocReadonlyTag`](JSDocReadonlyTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3978

#### Parameters

##### node

[`JSDocReadonlyTag`](JSDocReadonlyTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReadonlyTag`](JSDocReadonlyTag.md)

***

### updateJSDocReturnTag()

> **updateJSDocReturnTag**(`node`, `tagName`, `typeExpression`, `comment`): [`JSDocReturnTag`](JSDocReturnTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3956

#### Parameters

##### node

[`JSDocReturnTag`](JSDocReturnTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

`undefined` | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocReturnTag`](JSDocReturnTag.md)

***

### updateJSDocSeeTag()

> **updateJSDocSeeTag**(`node`, `tagName`, `nameExpression`, `comment?`): [`JSDocSeeTag`](JSDocSeeTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3954

#### Parameters

##### node

[`JSDocSeeTag`](JSDocSeeTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### nameExpression

`undefined` | [`JSDocNameReference`](JSDocNameReference.md)

##### comment?

`string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocSeeTag`](JSDocSeeTag.md)

***

### updateJSDocSignature()

> **updateJSDocSignature**(`node`, `typeParameters`, `parameters`, `type`): [`JSDocSignature`](JSDocSignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3942

#### Parameters

##### node

[`JSDocSignature`](JSDocSignature.md)

##### typeParameters

`undefined` | readonly [`JSDocTemplateTag`](JSDocTemplateTag.md)[]

##### parameters

readonly [`JSDocParameterTag`](JSDocParameterTag.md)[]

##### type

`undefined` | [`JSDocReturnTag`](JSDocReturnTag.md)

#### Returns

[`JSDocSignature`](JSDocSignature.md)

***

### updateJSDocTemplateTag()

> **updateJSDocTemplateTag**(`node`, `tagName`, `constraint`, `typeParameters`, `comment`): [`JSDocTemplateTag`](JSDocTemplateTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3944

#### Parameters

##### node

[`JSDocTemplateTag`](JSDocTemplateTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### constraint

`undefined` | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### typeParameters

readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTemplateTag`](JSDocTemplateTag.md)

***

### updateJSDocText()

> **updateJSDocText**(`node`, `text`): [`JSDocText`](JSDocText.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3986

#### Parameters

##### node

[`JSDocText`](JSDocText.md)

##### text

`string`

#### Returns

[`JSDocText`](JSDocText.md)

***

### updateJSDocThisTag()

> **updateJSDocThisTag**(`node`, `tagName`, `typeExpression`, `comment`): [`JSDocThisTag`](JSDocThisTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3958

#### Parameters

##### node

[`JSDocThisTag`](JSDocThisTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

`undefined` | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocThisTag`](JSDocThisTag.md)

***

### updateJSDocTypedefTag()

> **updateJSDocTypedefTag**(`node`, `tagName`, `typeExpression`, `fullName`, `comment`): [`JSDocTypedefTag`](JSDocTypedefTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3946

#### Parameters

##### node

[`JSDocTypedefTag`](JSDocTypedefTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

`undefined` | [`JSDocTypeLiteral`](JSDocTypeLiteral.md) | [`JSDocTypeExpression`](JSDocTypeExpression.md)

##### fullName

`undefined` | [`Identifier`](Identifier.md) | [`JSDocNamespaceDeclaration`](JSDocNamespaceDeclaration.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypedefTag`](JSDocTypedefTag.md)

***

### updateJSDocTypeExpression()

> **updateJSDocTypeExpression**(`node`, `type`): [`JSDocTypeExpression`](JSDocTypeExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3928

#### Parameters

##### node

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocTypeExpression`](JSDocTypeExpression.md)

***

### updateJSDocTypeLiteral()

> **updateJSDocTypeLiteral**(`node`, `jsDocPropertyTags`, `isArrayType`): [`JSDocTypeLiteral`](JSDocTypeLiteral.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3940

#### Parameters

##### node

[`JSDocTypeLiteral`](JSDocTypeLiteral.md)

##### jsDocPropertyTags

`undefined` | readonly [`JSDocPropertyLikeTag`](JSDocPropertyLikeTag.md)[]

##### isArrayType

`undefined` | `boolean`

#### Returns

[`JSDocTypeLiteral`](JSDocTypeLiteral.md)

***

### updateJSDocTypeTag()

> **updateJSDocTypeTag**(`node`, `tagName`, `typeExpression`, `comment`): [`JSDocTypeTag`](JSDocTypeTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3952

#### Parameters

##### node

[`JSDocTypeTag`](JSDocTypeTag.md)

##### tagName

`undefined` | [`Identifier`](Identifier.md)

##### typeExpression

[`JSDocTypeExpression`](JSDocTypeExpression.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocTypeTag`](JSDocTypeTag.md)

***

### updateJSDocUnknownTag()

> **updateJSDocUnknownTag**(`node`, `tagName`, `comment`): [`JSDocUnknownTag`](JSDocUnknownTag.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3980

#### Parameters

##### node

[`JSDocUnknownTag`](JSDocUnknownTag.md)

##### tagName

[`Identifier`](Identifier.md)

##### comment

`undefined` | `string` | [`NodeArray`](NodeArray.md)\<[`JSDocComment`](../type-aliases/JSDocComment.md)\>

#### Returns

[`JSDocUnknownTag`](JSDocUnknownTag.md)

***

### updateJSDocVariadicType()

> **updateJSDocVariadicType**(`node`, `type`): [`JSDocVariadicType`](JSDocVariadicType.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3924

#### Parameters

##### node

[`JSDocVariadicType`](JSDocVariadicType.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`JSDocVariadicType`](JSDocVariadicType.md)

***

### updateJsxAttribute()

> **updateJsxAttribute**(`node`, `name`, `initializer`): [`JsxAttribute`](JsxAttribute.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4004

#### Parameters

##### node

[`JsxAttribute`](JsxAttribute.md)

##### name

[`Identifier`](Identifier.md)

##### initializer

`undefined` | [`JsxAttributeValue`](../type-aliases/JsxAttributeValue.md)

#### Returns

[`JsxAttribute`](JsxAttribute.md)

***

### updateJsxAttributes()

> **updateJsxAttributes**(`node`, `properties`): [`JsxAttributes`](JsxAttributes.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4006

#### Parameters

##### node

[`JsxAttributes`](JsxAttributes.md)

##### properties

readonly [`JsxAttributeLike`](../type-aliases/JsxAttributeLike.md)[]

#### Returns

[`JsxAttributes`](JsxAttributes.md)

***

### updateJsxClosingElement()

> **updateJsxClosingElement**(`node`, `tagName`): [`JsxClosingElement`](JsxClosingElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3996

#### Parameters

##### node

[`JsxClosingElement`](JsxClosingElement.md)

##### tagName

[`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

#### Returns

[`JsxClosingElement`](JsxClosingElement.md)

***

### updateJsxElement()

> **updateJsxElement**(`node`, `openingElement`, `children`, `closingElement`): [`JsxElement`](JsxElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3990

#### Parameters

##### node

[`JsxElement`](JsxElement.md)

##### openingElement

[`JsxOpeningElement`](JsxOpeningElement.md)

##### children

readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

##### closingElement

[`JsxClosingElement`](JsxClosingElement.md)

#### Returns

[`JsxElement`](JsxElement.md)

***

### updateJsxExpression()

> **updateJsxExpression**(`node`, `expression`): [`JsxExpression`](JsxExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4010

#### Parameters

##### node

[`JsxExpression`](JsxExpression.md)

##### expression

`undefined` | [`Expression`](Expression.md)

#### Returns

[`JsxExpression`](JsxExpression.md)

***

### updateJsxFragment()

> **updateJsxFragment**(`node`, `openingFragment`, `children`, `closingFragment`): [`JsxFragment`](JsxFragment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4002

#### Parameters

##### node

[`JsxFragment`](JsxFragment.md)

##### openingFragment

[`JsxOpeningFragment`](JsxOpeningFragment.md)

##### children

readonly [`JsxChild`](../type-aliases/JsxChild.md)[]

##### closingFragment

[`JsxClosingFragment`](JsxClosingFragment.md)

#### Returns

[`JsxFragment`](JsxFragment.md)

***

### updateJsxOpeningElement()

> **updateJsxOpeningElement**(`node`, `tagName`, `typeArguments`, `attributes`): [`JsxOpeningElement`](JsxOpeningElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3994

#### Parameters

##### node

[`JsxOpeningElement`](JsxOpeningElement.md)

##### tagName

[`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### attributes

[`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxOpeningElement`](JsxOpeningElement.md)

***

### updateJsxSelfClosingElement()

> **updateJsxSelfClosingElement**(`node`, `tagName`, `typeArguments`, `attributes`): [`JsxSelfClosingElement`](JsxSelfClosingElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3992

#### Parameters

##### node

[`JsxSelfClosingElement`](JsxSelfClosingElement.md)

##### tagName

[`JsxTagNameExpression`](../type-aliases/JsxTagNameExpression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### attributes

[`JsxAttributes`](JsxAttributes.md)

#### Returns

[`JsxSelfClosingElement`](JsxSelfClosingElement.md)

***

### updateJsxSpreadAttribute()

> **updateJsxSpreadAttribute**(`node`, `expression`): [`JsxSpreadAttribute`](JsxSpreadAttribute.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4008

#### Parameters

##### node

[`JsxSpreadAttribute`](JsxSpreadAttribute.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`JsxSpreadAttribute`](JsxSpreadAttribute.md)

***

### updateJsxText()

> **updateJsxText**(`node`, `text`, `containsOnlyTriviaWhiteSpaces?`): [`JsxText`](JsxText.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3999

#### Parameters

##### node

[`JsxText`](JsxText.md)

##### text

`string`

##### containsOnlyTriviaWhiteSpaces?

`boolean`

#### Returns

[`JsxText`](JsxText.md)

***

### updateLabeledStatement()

> **updateLabeledStatement**(`node`, `label`, `statement`): [`LabeledStatement`](LabeledStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3853

#### Parameters

##### node

[`LabeledStatement`](LabeledStatement.md)

##### label

[`Identifier`](Identifier.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`LabeledStatement`](LabeledStatement.md)

***

### updateLiteralTypeNode()

> **updateLiteralTypeNode**(`node`, `literal`): [`LiteralTypeNode`](LiteralTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3735

#### Parameters

##### node

[`LiteralTypeNode`](LiteralTypeNode.md)

##### literal

[`LiteralExpression`](LiteralExpression.md) | [`PrefixUnaryExpression`](PrefixUnaryExpression.md) | [`NullLiteral`](NullLiteral.md) | [`BooleanLiteral`](../type-aliases/BooleanLiteral.md)

#### Returns

[`LiteralTypeNode`](LiteralTypeNode.md)

***

### updateMappedTypeNode()

> **updateMappedTypeNode**(`node`, `readonlyToken`, `typeParameter`, `nameType`, `questionToken`, `type`, `members`): [`MappedTypeNode`](MappedTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3733

#### Parameters

##### node

[`MappedTypeNode`](MappedTypeNode.md)

##### readonlyToken

`undefined` | [`ReadonlyKeyword`](../type-aliases/ReadonlyKeyword.md) | [`PlusToken`](../type-aliases/PlusToken.md) | [`MinusToken`](../type-aliases/MinusToken.md)

##### typeParameter

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

##### nameType

`undefined` | [`TypeNode`](TypeNode.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`PlusToken`](../type-aliases/PlusToken.md) | [`MinusToken`](../type-aliases/MinusToken.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### members

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeElement`](TypeElement.md)\>

#### Returns

[`MappedTypeNode`](MappedTypeNode.md)

***

### updateMetaProperty()

> **updateMetaProperty**(`node`, `name`): [`MetaProperty`](MetaProperty.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3817

#### Parameters

##### node

[`MetaProperty`](MetaProperty.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`MetaProperty`](MetaProperty.md)

***

### updateMethodDeclaration()

#### Call Signature

> **updateMethodDeclaration**(`node`, `modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](MethodDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3675

##### Parameters

###### node

[`MethodDeclaration`](MethodDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

[`PropertyName`](../type-aliases/PropertyName.md)

###### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`MethodDeclaration`](MethodDeclaration.md)

#### Call Signature

> **updateMethodDeclaration**(`node`, `decorators`, `modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](MethodDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8434

##### Parameters

###### node

[`MethodDeclaration`](MethodDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

###### name

[`PropertyName`](../type-aliases/PropertyName.md)

###### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`MethodDeclaration`](MethodDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateMethodSignature()

> **updateMethodSignature**(`node`, `modifiers`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`): [`MethodSignature`](MethodSignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3673

#### Parameters

##### node

[`MethodSignature`](MethodSignature.md)

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### name

[`PropertyName`](../type-aliases/PropertyName.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### typeParameters

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeParameterDeclaration`](TypeParameterDeclaration.md)\>

##### parameters

[`NodeArray`](NodeArray.md)\<[`ParameterDeclaration`](ParameterDeclaration.md)\>

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`MethodSignature`](MethodSignature.md)

***

### updateModuleBlock()

> **updateModuleBlock**(`node`, `statements`): [`ModuleBlock`](ModuleBlock.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3878

#### Parameters

##### node

[`ModuleBlock`](ModuleBlock.md)

##### statements

readonly [`Statement`](Statement.md)[]

#### Returns

[`ModuleBlock`](ModuleBlock.md)

***

### updateModuleDeclaration()

#### Call Signature

> **updateModuleDeclaration**(`node`, `modifiers`, `name`, `body`): [`ModuleDeclaration`](ModuleDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3876

##### Parameters

###### node

[`ModuleDeclaration`](ModuleDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`ModuleName`](../type-aliases/ModuleName.md)

###### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

##### Returns

[`ModuleDeclaration`](ModuleDeclaration.md)

#### Call Signature

> **updateModuleDeclaration**(`node`, `decorators`, `modifiers`, `name`, `body`): [`ModuleDeclaration`](ModuleDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8530

##### Parameters

###### node

[`ModuleDeclaration`](ModuleDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`ModuleName`](../type-aliases/ModuleName.md)

###### body

`undefined` | [`ModuleBody`](../type-aliases/ModuleBody.md)

##### Returns

[`ModuleDeclaration`](ModuleDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateNamedExports()

> **updateNamedExports**(`node`, `elements`): [`NamedExports`](NamedExports.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3908

#### Parameters

##### node

[`NamedExports`](NamedExports.md)

##### elements

readonly [`ExportSpecifier`](ExportSpecifier.md)[]

#### Returns

[`NamedExports`](NamedExports.md)

***

### updateNamedImports()

> **updateNamedImports**(`node`, `elements`): [`NamedImports`](NamedImports.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3900

#### Parameters

##### node

[`NamedImports`](NamedImports.md)

##### elements

readonly [`ImportSpecifier`](ImportSpecifier.md)[]

#### Returns

[`NamedImports`](NamedImports.md)

***

### updateNamedTupleMember()

> **updateNamedTupleMember**(`node`, `dotDotDotToken`, `name`, `questionToken`, `type`): [`NamedTupleMember`](NamedTupleMember.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3710

#### Parameters

##### node

[`NamedTupleMember`](NamedTupleMember.md)

##### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

##### name

[`Identifier`](Identifier.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`NamedTupleMember`](NamedTupleMember.md)

***

### updateNamespaceExport()

> **updateNamespaceExport**(`node`, `name`): [`NamespaceExport`](NamespaceExport.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3898

#### Parameters

##### node

[`NamespaceExport`](NamespaceExport.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`NamespaceExport`](NamespaceExport.md)

***

### updateNamespaceExportDeclaration()

> **updateNamespaceExportDeclaration**(`node`, `name`): [`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3882

#### Parameters

##### node

[`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`NamespaceExportDeclaration`](NamespaceExportDeclaration.md)

***

### updateNamespaceImport()

> **updateNamespaceImport**(`node`, `name`): [`NamespaceImport`](NamespaceImport.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3896

#### Parameters

##### node

[`NamespaceImport`](NamespaceImport.md)

##### name

[`Identifier`](Identifier.md)

#### Returns

[`NamespaceImport`](NamespaceImport.md)

***

### updateNewExpression()

> **updateNewExpression**(`node`, `expression`, `typeArguments`, `argumentsArray`): [`NewExpression`](NewExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3761

#### Parameters

##### node

[`NewExpression`](NewExpression.md)

##### expression

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### argumentsArray

`undefined` | readonly [`Expression`](Expression.md)[]

#### Returns

[`NewExpression`](NewExpression.md)

***

### updateNonNullChain()

> **updateNonNullChain**(`node`, `expression`): [`NonNullChain`](NonNullChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3815

#### Parameters

##### node

[`NonNullChain`](NonNullChain.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`NonNullChain`](NonNullChain.md)

***

### updateNonNullExpression()

> **updateNonNullExpression**(`node`, `expression`): [`NonNullExpression`](NonNullExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3813

#### Parameters

##### node

[`NonNullExpression`](NonNullExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`NonNullExpression`](NonNullExpression.md)

***

### updateObjectBindingPattern()

> **updateObjectBindingPattern**(`node`, `elements`): [`ObjectBindingPattern`](ObjectBindingPattern.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3739

#### Parameters

##### node

[`ObjectBindingPattern`](ObjectBindingPattern.md)

##### elements

readonly [`BindingElement`](BindingElement.md)[]

#### Returns

[`ObjectBindingPattern`](ObjectBindingPattern.md)

***

### updateObjectLiteralExpression()

> **updateObjectLiteralExpression**(`node`, `properties`): [`ObjectLiteralExpression`](ObjectLiteralExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3747

#### Parameters

##### node

[`ObjectLiteralExpression`](ObjectLiteralExpression.md)

##### properties

readonly [`ObjectLiteralElementLike`](../type-aliases/ObjectLiteralElementLike.md)[]

#### Returns

[`ObjectLiteralExpression`](ObjectLiteralExpression.md)

***

### updateOptionalTypeNode()

> **updateOptionalTypeNode**(`node`, `type`): [`OptionalTypeNode`](OptionalTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3712

#### Parameters

##### node

[`OptionalTypeNode`](OptionalTypeNode.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`OptionalTypeNode`](OptionalTypeNode.md)

***

### updateParameterDeclaration()

#### Call Signature

> **updateParameterDeclaration**(`node`, `modifiers`, `dotDotDotToken`, `name`, `questionToken`, `type`, `initializer`): [`ParameterDeclaration`](ParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3665

##### Parameters

###### node

[`ParameterDeclaration`](ParameterDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

###### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

###### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### initializer

`undefined` | [`Expression`](Expression.md)

##### Returns

[`ParameterDeclaration`](ParameterDeclaration.md)

#### Call Signature

> **updateParameterDeclaration**(`node`, `decorators`, `modifiers`, `dotDotDotToken`, `name`, `questionToken`, `type`, `initializer`): [`ParameterDeclaration`](ParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8418

##### Parameters

###### node

[`ParameterDeclaration`](ParameterDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

###### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

###### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### initializer

`undefined` | [`Expression`](Expression.md)

##### Returns

[`ParameterDeclaration`](ParameterDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateParenthesizedExpression()

> **updateParenthesizedExpression**(`node`, `expression`): [`ParenthesizedExpression`](ParenthesizedExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3767

#### Parameters

##### node

[`ParenthesizedExpression`](ParenthesizedExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`ParenthesizedExpression`](ParenthesizedExpression.md)

***

### updateParenthesizedType()

> **updateParenthesizedType**(`node`, `type`): [`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3726

#### Parameters

##### node

[`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`ParenthesizedTypeNode`](ParenthesizedTypeNode.md)

***

### updatePartiallyEmittedExpression()

> **updatePartiallyEmittedExpression**(`node`, `expression`): [`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4031

#### Parameters

##### node

[`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`PartiallyEmittedExpression`](PartiallyEmittedExpression.md)

***

### updatePostfixUnaryExpression()

> **updatePostfixUnaryExpression**(`node`, `operand`): [`PostfixUnaryExpression`](PostfixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3785

#### Parameters

##### node

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

##### operand

[`Expression`](Expression.md)

#### Returns

[`PostfixUnaryExpression`](PostfixUnaryExpression.md)

***

### updatePrefixUnaryExpression()

> **updatePrefixUnaryExpression**(`node`, `operand`): [`PrefixUnaryExpression`](PrefixUnaryExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3783

#### Parameters

##### node

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

##### operand

[`Expression`](Expression.md)

#### Returns

[`PrefixUnaryExpression`](PrefixUnaryExpression.md)

***

### updatePropertyAccessChain()

> **updatePropertyAccessChain**(`node`, `expression`, `questionDotToken`, `name`): [`PropertyAccessChain`](PropertyAccessChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3751

#### Parameters

##### node

[`PropertyAccessChain`](PropertyAccessChain.md)

##### expression

[`Expression`](Expression.md)

##### questionDotToken

`undefined` | [`QuestionDotToken`](../type-aliases/QuestionDotToken.md)

##### name

[`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessChain`](PropertyAccessChain.md)

***

### updatePropertyAccessExpression()

> **updatePropertyAccessExpression**(`node`, `expression`, `name`): [`PropertyAccessExpression`](PropertyAccessExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3749

#### Parameters

##### node

[`PropertyAccessExpression`](PropertyAccessExpression.md)

##### expression

[`Expression`](Expression.md)

##### name

[`MemberName`](../type-aliases/MemberName.md)

#### Returns

[`PropertyAccessExpression`](PropertyAccessExpression.md)

***

### updatePropertyAssignment()

> **updatePropertyAssignment**(`node`, `name`, `initializer`): [`PropertyAssignment`](PropertyAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4020

#### Parameters

##### node

[`PropertyAssignment`](PropertyAssignment.md)

##### name

[`PropertyName`](../type-aliases/PropertyName.md)

##### initializer

[`Expression`](Expression.md)

#### Returns

[`PropertyAssignment`](PropertyAssignment.md)

***

### updatePropertyDeclaration()

#### Call Signature

> **updatePropertyDeclaration**(`node`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](PropertyDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3671

##### Parameters

###### node

[`PropertyDeclaration`](PropertyDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### questionOrExclamationToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### initializer

`undefined` | [`Expression`](Expression.md)

##### Returns

[`PropertyDeclaration`](PropertyDeclaration.md)

#### Call Signature

> **updatePropertyDeclaration**(`node`, `decorators`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](PropertyDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8426

##### Parameters

###### node

[`PropertyDeclaration`](PropertyDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

###### questionOrExclamationToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

###### type

`undefined` | [`TypeNode`](TypeNode.md)

###### initializer

`undefined` | [`Expression`](Expression.md)

##### Returns

[`PropertyDeclaration`](PropertyDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updatePropertySignature()

> **updatePropertySignature**(`node`, `modifiers`, `name`, `questionToken`, `type`): [`PropertySignature`](PropertySignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3669

#### Parameters

##### node

[`PropertySignature`](PropertySignature.md)

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### name

[`PropertyName`](../type-aliases/PropertyName.md)

##### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`PropertySignature`](PropertySignature.md)

***

### updateQualifiedName()

> **updateQualifiedName**(`node`, `left`, `right`): [`QualifiedName`](QualifiedName.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3659

#### Parameters

##### node

[`QualifiedName`](QualifiedName.md)

##### left

[`EntityName`](../type-aliases/EntityName.md)

##### right

[`Identifier`](Identifier.md)

#### Returns

[`QualifiedName`](QualifiedName.md)

***

### updateRestTypeNode()

> **updateRestTypeNode**(`node`, `type`): [`RestTypeNode`](RestTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3714

#### Parameters

##### node

[`RestTypeNode`](RestTypeNode.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`RestTypeNode`](RestTypeNode.md)

***

### updateReturnStatement()

> **updateReturnStatement**(`node`, `expression`): [`ReturnStatement`](ReturnStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3847

#### Parameters

##### node

[`ReturnStatement`](ReturnStatement.md)

##### expression

`undefined` | [`Expression`](Expression.md)

#### Returns

[`ReturnStatement`](ReturnStatement.md)

***

### updateSatisfiesExpression()

> **updateSatisfiesExpression**(`node`, `expression`, `type`): [`SatisfiesExpression`](SatisfiesExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3819

#### Parameters

##### node

[`SatisfiesExpression`](SatisfiesExpression.md)

##### expression

[`Expression`](Expression.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`SatisfiesExpression`](SatisfiesExpression.md)

***

### updateSetAccessorDeclaration()

#### Call Signature

> **updateSetAccessorDeclaration**(`node`, `modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](SetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3681

##### Parameters

###### node

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

###### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

###### name

[`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

#### Call Signature

> **updateSetAccessorDeclaration**(`node`, `decorators`, `modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](SetAccessorDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8458

##### Parameters

###### node

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`PropertyName`](../type-aliases/PropertyName.md)

###### parameters

readonly [`ParameterDeclaration`](ParameterDeclaration.md)[]

###### body

`undefined` | [`Block`](Block.md)

##### Returns

[`SetAccessorDeclaration`](SetAccessorDeclaration.md)

##### Deprecated

Decorators have been combined with modifiers. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateShorthandPropertyAssignment()

> **updateShorthandPropertyAssignment**(`node`, `name`, `objectAssignmentInitializer`): [`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4022

#### Parameters

##### node

[`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

##### name

[`Identifier`](Identifier.md)

##### objectAssignmentInitializer

`undefined` | [`Expression`](Expression.md)

#### Returns

[`ShorthandPropertyAssignment`](ShorthandPropertyAssignment.md)

***

### updateSourceFile()

> **updateSourceFile**(`node`, `statements`, `isDeclarationFile?`, `referencedFiles?`, `typeReferences?`, `hasNoDefaultLib?`, `libReferences?`): [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4028

#### Parameters

##### node

[`SourceFile`](SourceFile.md)

##### statements

readonly [`Statement`](Statement.md)[]

##### isDeclarationFile?

`boolean`

##### referencedFiles?

readonly [`FileReference`](FileReference.md)[]

##### typeReferences?

readonly [`FileReference`](FileReference.md)[]

##### hasNoDefaultLib?

`boolean`

##### libReferences?

readonly [`FileReference`](FileReference.md)[]

#### Returns

[`SourceFile`](SourceFile.md)

***

### updateSpreadAssignment()

> **updateSpreadAssignment**(`node`, `expression`): [`SpreadAssignment`](SpreadAssignment.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4024

#### Parameters

##### node

[`SpreadAssignment`](SpreadAssignment.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`SpreadAssignment`](SpreadAssignment.md)

***

### updateSpreadElement()

> **updateSpreadElement**(`node`, `expression`): [`SpreadElement`](SpreadElement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3804

#### Parameters

##### node

[`SpreadElement`](SpreadElement.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`SpreadElement`](SpreadElement.md)

***

### updateStructDeclaration()

> **updateStructDeclaration**(`node`, `modifiers`, `name`, `typeParameters`, `heritageClauses`, `members`): [`StructDeclaration`](StructDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3868

#### Parameters

##### node

[`StructDeclaration`](StructDeclaration.md)

##### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

##### name

`undefined` | [`Identifier`](Identifier.md)

##### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

##### heritageClauses

`undefined` | readonly [`HeritageClause`](HeritageClause.md)[]

##### members

readonly [`ClassElement`](ClassElement.md)[]

#### Returns

[`StructDeclaration`](StructDeclaration.md)

***

### updateSwitchStatement()

> **updateSwitchStatement**(`node`, `expression`, `caseBlock`): [`SwitchStatement`](SwitchStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3851

#### Parameters

##### node

[`SwitchStatement`](SwitchStatement.md)

##### expression

[`Expression`](Expression.md)

##### caseBlock

[`CaseBlock`](CaseBlock.md)

#### Returns

[`SwitchStatement`](SwitchStatement.md)

***

### updateTaggedTemplateExpression()

> **updateTaggedTemplateExpression**(`node`, `tag`, `typeArguments`, `template`): [`TaggedTemplateExpression`](TaggedTemplateExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3763

#### Parameters

##### node

[`TaggedTemplateExpression`](TaggedTemplateExpression.md)

##### tag

[`Expression`](Expression.md)

##### typeArguments

`undefined` | readonly [`TypeNode`](TypeNode.md)[]

##### template

[`TemplateLiteral`](../type-aliases/TemplateLiteral.md)

#### Returns

[`TaggedTemplateExpression`](TaggedTemplateExpression.md)

***

### updateTemplateExpression()

> **updateTemplateExpression**(`node`, `head`, `templateSpans`): [`TemplateExpression`](TemplateExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3791

#### Parameters

##### node

[`TemplateExpression`](TemplateExpression.md)

##### head

[`TemplateHead`](TemplateHead.md)

##### templateSpans

readonly [`TemplateSpan`](TemplateSpan.md)[]

#### Returns

[`TemplateExpression`](TemplateExpression.md)

***

### updateTemplateLiteralType()

> **updateTemplateLiteralType**(`node`, `head`, `templateSpans`): [`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3737

#### Parameters

##### node

[`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

##### head

[`TemplateHead`](TemplateHead.md)

##### templateSpans

readonly [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)[]

#### Returns

[`TemplateLiteralTypeNode`](TemplateLiteralTypeNode.md)

***

### updateTemplateLiteralTypeSpan()

> **updateTemplateLiteralTypeSpan**(`node`, `type`, `literal`): [`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3689

#### Parameters

##### node

[`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

##### type

[`TypeNode`](TypeNode.md)

##### literal

[`TemplateMiddle`](TemplateMiddle.md) | [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateLiteralTypeSpan`](TemplateLiteralTypeSpan.md)

***

### updateTemplateSpan()

> **updateTemplateSpan**(`node`, `expression`, `literal`): [`TemplateSpan`](TemplateSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3821

#### Parameters

##### node

[`TemplateSpan`](TemplateSpan.md)

##### expression

[`Expression`](Expression.md)

##### literal

[`TemplateMiddle`](TemplateMiddle.md) | [`TemplateTail`](TemplateTail.md)

#### Returns

[`TemplateSpan`](TemplateSpan.md)

***

### updateThrowStatement()

> **updateThrowStatement**(`node`, `expression`): [`ThrowStatement`](ThrowStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3855

#### Parameters

##### node

[`ThrowStatement`](ThrowStatement.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`ThrowStatement`](ThrowStatement.md)

***

### updateTryStatement()

> **updateTryStatement**(`node`, `tryBlock`, `catchClause`, `finallyBlock`): [`TryStatement`](TryStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3857

#### Parameters

##### node

[`TryStatement`](TryStatement.md)

##### tryBlock

[`Block`](Block.md)

##### catchClause

`undefined` | [`CatchClause`](CatchClause.md)

##### finallyBlock

`undefined` | [`Block`](Block.md)

#### Returns

[`TryStatement`](TryStatement.md)

***

### updateTupleTypeNode()

> **updateTupleTypeNode**(`node`, `elements`): [`TupleTypeNode`](TupleTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3708

#### Parameters

##### node

[`TupleTypeNode`](TupleTypeNode.md)

##### elements

readonly ([`TypeNode`](TypeNode.md) \| [`NamedTupleMember`](NamedTupleMember.md))[]

#### Returns

[`TupleTypeNode`](TupleTypeNode.md)

***

### updateTypeAliasDeclaration()

#### Call Signature

> **updateTypeAliasDeclaration**(`node`, `modifiers`, `name`, `typeParameters`, `type`): [`TypeAliasDeclaration`](TypeAliasDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3872

##### Parameters

###### node

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

#### Call Signature

> **updateTypeAliasDeclaration**(`node`, `decorators`, `modifiers`, `name`, `typeParameters`, `type`): [`TypeAliasDeclaration`](TypeAliasDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8514

##### Parameters

###### node

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

###### decorators

`undefined` | readonly [`Decorator`](Decorator.md)[]

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](TypeParameterDeclaration.md)[]

###### type

[`TypeNode`](TypeNode.md)

##### Returns

[`TypeAliasDeclaration`](TypeAliasDeclaration.md)

##### Deprecated

Decorators are no longer supported for this function. Callers should use an overload that does not accept a `decorators` parameter.

***

### updateTypeAssertion()

> **updateTypeAssertion**(`node`, `type`, `expression`): [`TypeAssertion`](TypeAssertion.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3765

#### Parameters

##### node

[`TypeAssertion`](TypeAssertion.md)

##### type

[`TypeNode`](TypeNode.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`TypeAssertion`](TypeAssertion.md)

***

### updateTypeLiteralNode()

> **updateTypeLiteralNode**(`node`, `members`): [`TypeLiteralNode`](TypeLiteralNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3704

#### Parameters

##### node

[`TypeLiteralNode`](TypeLiteralNode.md)

##### members

[`NodeArray`](NodeArray.md)\<[`TypeElement`](TypeElement.md)\>

#### Returns

[`TypeLiteralNode`](TypeLiteralNode.md)

***

### updateTypeOfExpression()

> **updateTypeOfExpression**(`node`, `expression`): [`TypeOfExpression`](TypeOfExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3777

#### Parameters

##### node

[`TypeOfExpression`](TypeOfExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`TypeOfExpression`](TypeOfExpression.md)

***

### updateTypeOperatorNode()

> **updateTypeOperatorNode**(`node`, `type`): [`TypeOperatorNode`](TypeOperatorNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3729

#### Parameters

##### node

[`TypeOperatorNode`](TypeOperatorNode.md)

##### type

[`TypeNode`](TypeNode.md)

#### Returns

[`TypeOperatorNode`](TypeOperatorNode.md)

***

### updateTypeParameterDeclaration()

#### Call Signature

> **updateTypeParameterDeclaration**(`node`, `modifiers`, `name`, `constraint`, `defaultType`): [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3663

##### Parameters

###### node

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

###### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

###### name

[`Identifier`](Identifier.md)

###### constraint

`undefined` | [`TypeNode`](TypeNode.md)

###### defaultType

`undefined` | [`TypeNode`](TypeNode.md)

##### Returns

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

#### Call Signature

> **updateTypeParameterDeclaration**(`node`, `name`, `constraint`, `defaultType`): [`TypeParameterDeclaration`](TypeParameterDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8360

##### Parameters

###### node

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

###### name

[`Identifier`](Identifier.md)

###### constraint

`undefined` | [`TypeNode`](TypeNode.md)

###### defaultType

`undefined` | [`TypeNode`](TypeNode.md)

##### Returns

[`TypeParameterDeclaration`](TypeParameterDeclaration.md)

##### Deprecated

Use the overload that accepts 'modifiers'

***

### updateTypePredicateNode()

> **updateTypePredicateNode**(`node`, `assertsModifier`, `parameterName`, `type`): [`TypePredicateNode`](TypePredicateNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3694

#### Parameters

##### node

[`TypePredicateNode`](TypePredicateNode.md)

##### assertsModifier

`undefined` | [`AssertsKeyword`](../type-aliases/AssertsKeyword.md)

##### parameterName

[`Identifier`](Identifier.md) | [`ThisTypeNode`](ThisTypeNode.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

#### Returns

[`TypePredicateNode`](TypePredicateNode.md)

***

### updateTypeQueryNode()

> **updateTypeQueryNode**(`node`, `exprName`, `typeArguments?`): [`TypeQueryNode`](TypeQueryNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3702

#### Parameters

##### node

[`TypeQueryNode`](TypeQueryNode.md)

##### exprName

[`EntityName`](../type-aliases/EntityName.md)

##### typeArguments?

readonly [`TypeNode`](TypeNode.md)[]

#### Returns

[`TypeQueryNode`](TypeQueryNode.md)

***

### updateTypeReferenceNode()

> **updateTypeReferenceNode**(`node`, `typeName`, `typeArguments`): [`TypeReferenceNode`](TypeReferenceNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3696

#### Parameters

##### node

[`TypeReferenceNode`](TypeReferenceNode.md)

##### typeName

[`EntityName`](../type-aliases/EntityName.md)

##### typeArguments

`undefined` | [`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

#### Returns

[`TypeReferenceNode`](TypeReferenceNode.md)

***

### updateUnionTypeNode()

> **updateUnionTypeNode**(`node`, `types`): [`UnionTypeNode`](UnionTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3716

#### Parameters

##### node

[`UnionTypeNode`](UnionTypeNode.md)

##### types

[`NodeArray`](NodeArray.md)\<[`TypeNode`](TypeNode.md)\>

#### Returns

[`UnionTypeNode`](UnionTypeNode.md)

***

### updateVariableDeclaration()

> **updateVariableDeclaration**(`node`, `name`, `exclamationToken`, `type`, `initializer`): [`VariableDeclaration`](VariableDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3860

#### Parameters

##### node

[`VariableDeclaration`](VariableDeclaration.md)

##### name

[`BindingName`](../type-aliases/BindingName.md)

##### exclamationToken

`undefined` | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

##### type

`undefined` | [`TypeNode`](TypeNode.md)

##### initializer

`undefined` | [`Expression`](Expression.md)

#### Returns

[`VariableDeclaration`](VariableDeclaration.md)

***

### updateVariableDeclarationList()

> **updateVariableDeclarationList**(`node`, `declarations`): [`VariableDeclarationList`](VariableDeclarationList.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3862

#### Parameters

##### node

[`VariableDeclarationList`](VariableDeclarationList.md)

##### declarations

readonly [`VariableDeclaration`](VariableDeclaration.md)[]

#### Returns

[`VariableDeclarationList`](VariableDeclarationList.md)

***

### updateVariableStatement()

> **updateVariableStatement**(`node`, `modifiers`, `declarationList`): [`VariableStatement`](VariableStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3826

#### Parameters

##### node

[`VariableStatement`](VariableStatement.md)

##### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

##### declarationList

[`VariableDeclarationList`](VariableDeclarationList.md)

#### Returns

[`VariableStatement`](VariableStatement.md)

***

### updateVoidExpression()

> **updateVoidExpression**(`node`, `expression`): [`VoidExpression`](VoidExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3779

#### Parameters

##### node

[`VoidExpression`](VoidExpression.md)

##### expression

[`Expression`](Expression.md)

#### Returns

[`VoidExpression`](VoidExpression.md)

***

### updateWhileStatement()

> **updateWhileStatement**(`node`, `expression`, `statement`): [`WhileStatement`](WhileStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3835

#### Parameters

##### node

[`WhileStatement`](WhileStatement.md)

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`WhileStatement`](WhileStatement.md)

***

### updateWithStatement()

> **updateWithStatement**(`node`, `expression`, `statement`): [`WithStatement`](WithStatement.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3849

#### Parameters

##### node

[`WithStatement`](WithStatement.md)

##### expression

[`Expression`](Expression.md)

##### statement

[`Statement`](Statement.md)

#### Returns

[`WithStatement`](WithStatement.md)

***

### updateYieldExpression()

> **updateYieldExpression**(`node`, `asteriskToken`, `expression`): [`YieldExpression`](YieldExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3802

#### Parameters

##### node

[`YieldExpression`](YieldExpression.md)

##### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

##### expression

`undefined` | [`Expression`](Expression.md)

#### Returns

[`YieldExpression`](YieldExpression.md)
