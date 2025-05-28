[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createTypeOperatorNode

# Variable: ~~createTypeOperatorNode()~~

> `const` **createTypeOperatorNode**: \{(`type`): [`TypeOperatorNode`](../interfaces/TypeOperatorNode.md); (`operator`, `type`): [`TypeOperatorNode`](../interfaces/TypeOperatorNode.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8214

## Call Signature

> (`type`): [`TypeOperatorNode`](../interfaces/TypeOperatorNode.md)

### Parameters

#### type

[`TypeNode`](../interfaces/TypeNode.md)

### Returns

[`TypeOperatorNode`](../interfaces/TypeOperatorNode.md)

## Call Signature

> (`operator`, `type`): [`TypeOperatorNode`](../interfaces/TypeOperatorNode.md)

### Parameters

#### operator

[`KeyOfKeyword`](../enumerations/SyntaxKind.md#keyofkeyword) | [`ReadonlyKeyword`](../enumerations/SyntaxKind.md#readonlykeyword) | [`UniqueKeyword`](../enumerations/SyntaxKind.md#uniquekeyword)

#### type

[`TypeNode`](../interfaces/TypeNode.md)

### Returns

[`TypeOperatorNode`](../interfaces/TypeOperatorNode.md)

## Deprecated

Use `factory.createTypeOperatorNode` or the factory supplied by your transformation context instead.
