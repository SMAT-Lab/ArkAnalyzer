[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / NodeVisitor

# Interface: NodeVisitor()

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4177

## Call Signature

> **NodeVisitor**\<`T`\>(`nodes`, `visitor`, `test?`, `lift?`): `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4178

### Type Parameters

#### T

`T` *extends* [`Node`](Node.md)

### Parameters

#### nodes

`T`

#### visitor

`undefined` | [`Visitor`](../type-aliases/Visitor.md)

#### test?

(`node`) => `boolean`

#### lift?

(`node`) => `T`

### Returns

`T`

## Call Signature

> **NodeVisitor**\<`T`\>(`nodes`, `visitor`, `test?`, `lift?`): `undefined` \| `T`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4179

### Type Parameters

#### T

`T` *extends* [`Node`](Node.md)

### Parameters

#### nodes

`undefined` | `T`

#### visitor

`undefined` | [`Visitor`](../type-aliases/Visitor.md)

#### test?

(`node`) => `boolean`

#### lift?

(`node`) => `T`

### Returns

`undefined` \| `T`
