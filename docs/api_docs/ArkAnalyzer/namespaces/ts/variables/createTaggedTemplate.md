[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createTaggedTemplate

# Variable: ~~createTaggedTemplate()~~

> `const` **createTaggedTemplate**: \{(`tag`, `template`): [`TaggedTemplateExpression`](../interfaces/TaggedTemplateExpression.md); (`tag`, `typeArguments`, `template`): [`TaggedTemplateExpression`](../interfaces/TaggedTemplateExpression.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8219

## Call Signature

> (`tag`, `template`): [`TaggedTemplateExpression`](../interfaces/TaggedTemplateExpression.md)

### Parameters

#### tag

[`Expression`](../interfaces/Expression.md)

#### template

[`TemplateLiteral`](../type-aliases/TemplateLiteral.md)

### Returns

[`TaggedTemplateExpression`](../interfaces/TaggedTemplateExpression.md)

## Call Signature

> (`tag`, `typeArguments`, `template`): [`TaggedTemplateExpression`](../interfaces/TaggedTemplateExpression.md)

### Parameters

#### tag

[`Expression`](../interfaces/Expression.md)

#### typeArguments

`undefined` | readonly [`TypeNode`](../interfaces/TypeNode.md)[]

#### template

[`TemplateLiteral`](../type-aliases/TemplateLiteral.md)

### Returns

[`TaggedTemplateExpression`](../interfaces/TaggedTemplateExpression.md)

## Deprecated

Use `factory.createTaggedTemplate` or the factory supplied by your transformation context instead.
