[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createConditional

# Variable: ~~createConditional()~~

> `const` **createConditional**: \{(`condition`, `whenTrue`, `whenFalse`): [`ConditionalExpression`](../interfaces/ConditionalExpression.md); (`condition`, `questionToken`, `whenTrue`, `colonToken`, `whenFalse`): [`ConditionalExpression`](../interfaces/ConditionalExpression.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8231

## Call Signature

> (`condition`, `whenTrue`, `whenFalse`): [`ConditionalExpression`](../interfaces/ConditionalExpression.md)

### Parameters

#### condition

[`Expression`](../interfaces/Expression.md)

#### whenTrue

[`Expression`](../interfaces/Expression.md)

#### whenFalse

[`Expression`](../interfaces/Expression.md)

### Returns

[`ConditionalExpression`](../interfaces/ConditionalExpression.md)

## Call Signature

> (`condition`, `questionToken`, `whenTrue`, `colonToken`, `whenFalse`): [`ConditionalExpression`](../interfaces/ConditionalExpression.md)

### Parameters

#### condition

[`Expression`](../interfaces/Expression.md)

#### questionToken

[`QuestionToken`](../type-aliases/QuestionToken.md)

#### whenTrue

[`Expression`](../interfaces/Expression.md)

#### colonToken

[`ColonToken`](../type-aliases/ColonToken.md)

#### whenFalse

[`Expression`](../interfaces/Expression.md)

### Returns

[`ConditionalExpression`](../interfaces/ConditionalExpression.md)

## Deprecated

Use `factory.createConditional` or the factory supplied by your transformation context instead.
