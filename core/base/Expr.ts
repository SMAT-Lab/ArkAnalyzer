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

// // Literals
// NumericLiteral,
// BigIntLiteral,
// StringLiteral,
// JsxText,
// JsxTextAllWhiteSpaces,
// RegularExpressionLiteral,
// NoSubstitutionTemplateLiteral,

export enum Operator {
    PlusToken,
    MinusToken,
    AsteriskToken,   // 乘法
    SlashToken,         // 除法
    EqualsToken,    // 赋值
}

export enum Literal {
    NumericLiteral,
    StringLiteral,
}


export type BinaryOperatorToken = Operator.PlusToken | Operator.MinusToken
    | Operator.AsteriskToken | Operator.SlashToken
    | Operator.EqualsToken;

export interface ArkExpression {

}


export abstract class ArkAbstractExpression {

}

export class ArkBinaryExpression extends ArkAbstractExpression {
    left: ArkExpression;
    operatorToken: BinaryOperatorToken;
    right: ArkExpression;
    constructor(left: ArkExpression, operatorToken: BinaryOperatorToken, right: ArkExpression) {
        super();
        this.left = left;
        this.right = right;
        this.operatorToken = operatorToken;
    }
}


export class ArkLiteralExpression extends ArkAbstractExpression {
    text: string;
    literalType: Literal;
    constructor(text: string, literalType: Literal) {
        super();
        this.text = text;
        this.literalType = literalType;
    }
}


export class CallExpression extends ArkAbstractExpression {
    expression: ArkExpression;
    arguments: ArkExpression[];
}