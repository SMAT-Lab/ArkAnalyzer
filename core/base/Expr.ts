// // Expression
// ArrayLiteralExpression,
// ObjectLiteralExpression,
// PropertyAccessExpression,
// ElementAccessExpression,
// CallExpression,
// NewExpression,
// TaggedTemplateExpression,
// TypeAssertionExpression,
// ParenthesizedExpression,
// FunctionExpression,
// ArrowFunction,
// DeleteExpression,
// TypeOfExpression,
// VoidExpression,
// AwaitExpression,
// PrefixUnaryExpression,
// PostfixUnaryExpression,
// BinaryExpression,
// ConditionalExpression,
// TemplateExpression,
// YieldExpression,
// SpreadElement,
// ClassExpression,
// OmittedExpression,
// ExpressionWithTypeArguments,
// AsExpression,
// NonNullExpression,
// MetaProperty,
// SyntheticExpression,
// SatisfiesExpression,

import { type } from "os";


export enum Operator {
    PlusToken,
    MinusToken,
    AsteriskToken,   // 乘法
    SlashToken,         // 除法
    EqualsToken,    // 赋值
}

export type BinaryOperatorToken = Operator.PlusToken | Operator.MinusToken
    | Operator.AsteriskToken | Operator.SlashToken
    | Operator.EqualsToken;

export interface ArkExpression {

}


export abstract class ArkAbstractExpression {

}

export class BinaryExpression extends ArkAbstractExpression {
    left: ArkExpression;
    operatorToken: BinaryOperatorToken;
    right: ArkExpression;
}