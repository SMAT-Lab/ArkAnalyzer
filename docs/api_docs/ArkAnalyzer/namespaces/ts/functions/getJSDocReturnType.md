[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getJSDocReturnType

# Function: getJSDocReturnType()

> **getJSDocReturnType**(`node`): `undefined` \| [`TypeNode`](../interfaces/TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4813

Gets the return type node for the node if provided via JSDoc return tag or type tag.

## Parameters

### node

[`Node`](../interfaces/Node.md)

## Returns

`undefined` \| [`TypeNode`](../interfaces/TypeNode.md)

## Remarks

`getJSDocReturnTag` just gets the whole JSDoc tag. This function
gets the type from inside the braces, after the fat arrow, etc.
