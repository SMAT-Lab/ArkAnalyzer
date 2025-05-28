[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createLiteral

# Variable: ~~createLiteral()~~

> `const` **createLiteral**: \{(`value`): [`StringLiteral`](../interfaces/StringLiteral.md); (`value`): [`NumericLiteral`](../interfaces/NumericLiteral.md); (`value`): [`BooleanLiteral`](../type-aliases/BooleanLiteral.md); (`value`): [`PrimaryExpression`](../interfaces/PrimaryExpression.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8203

## Call Signature

> (`value`): [`StringLiteral`](../interfaces/StringLiteral.md)

### Parameters

#### value

`string` | [`Identifier`](../interfaces/Identifier.md) | [`StringLiteral`](../interfaces/StringLiteral.md) | [`NumericLiteral`](../interfaces/NumericLiteral.md) | [`NoSubstitutionTemplateLiteral`](../interfaces/NoSubstitutionTemplateLiteral.md)

### Returns

[`StringLiteral`](../interfaces/StringLiteral.md)

## Call Signature

> (`value`): [`NumericLiteral`](../interfaces/NumericLiteral.md)

### Parameters

#### value

`number` | [`PseudoBigInt`](../interfaces/PseudoBigInt.md)

### Returns

[`NumericLiteral`](../interfaces/NumericLiteral.md)

## Call Signature

> (`value`): [`BooleanLiteral`](../type-aliases/BooleanLiteral.md)

### Parameters

#### value

`boolean`

### Returns

[`BooleanLiteral`](../type-aliases/BooleanLiteral.md)

## Call Signature

> (`value`): [`PrimaryExpression`](../interfaces/PrimaryExpression.md)

### Parameters

#### value

`string` | `number` | `boolean` | [`PseudoBigInt`](../interfaces/PseudoBigInt.md)

### Returns

[`PrimaryExpression`](../interfaces/PrimaryExpression.md)

## Deprecated

Use `factory.createStringLiteral`, `factory.createStringLiteralFromNode`, `factory.createNumericLiteral`, `factory.createBigIntLiteral`, `factory.createTrue`, `factory.createFalse`, or the factory supplied by your transformation context instead.
