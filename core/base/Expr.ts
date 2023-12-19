import {
    ArkStmt,
} from './Stmt'


export enum OperatorToken {
    // 算术运算符
    PlusToken,
    MinusToken,
    AsteriskToken,
    SlashToken,

    // 逻辑运算符
    AmpersandAmpersandToken,
    BarBarToken,

    // 位运算符
    AmpersandToken,
    BarToken,
    CaretToken,

    // 赋值运算符
    EqualsToken,
    PlusEqualsToken,
    MinusEqualsToken,

    PlusPlusToken,
    MinusMinusToken,
}

export type ArithmeticOperator =
    | OperatorToken.PlusToken
    | OperatorToken.MinusToken
    | OperatorToken.AsteriskToken
    | OperatorToken.SlashToken

export type LogicalOperator =
    | OperatorToken.AmpersandAmpersandToken
    | OperatorToken.BarBarToken

export type BitwiseOperator =
    | OperatorToken.AmpersandToken
    | OperatorToken.BarToken
    | OperatorToken.CaretToken

export type AssignmentOperator =
    | OperatorToken.EqualsToken
    | OperatorToken.PlusEqualsToken
    | OperatorToken.MinusEqualsToken

export type BinaryOperator =
    | ArithmeticOperator
    | LogicalOperator
    | BitwiseOperator
    | AssignmentOperator


export type PrefixUnaryOperator =
    | OperatorToken.PlusPlusToken
    | OperatorToken.MinusMinusToken


export type PostfixUnaryOperator =
    | OperatorToken.PlusPlusToken
    | OperatorToken.MinusMinusToken


export enum LiteralType {
    NumericLiteral,
    StringLiteral,
    BigIntLiteral,
    BooleanLiteral,
    NullLiteral,
}


export interface ArkExpression {

}


export abstract class ArkAbstractExpression implements ArkExpression {

}

export class ArkCallExpression extends ArkAbstractExpression {
    expression: ArkExpression;
    args: ArkExpression[];
    constructor(expression: ArkExpression, args: ArkExpression[]) {
        super();
        this.expression = expression;
        this.args = args;
    }
}


export class ArkFunctionExpression extends ArkAbstractExpression {
    name?: ArkIdentifier;
    body: ArkStmt;
    constructor(body: ArkStmt, name?: ArkIdentifier) {
        super();
        this.name = name;
        this.body = body;
    }
}

export class ArkArrowFunctionExpression extends ArkAbstractExpression {
    name?: ArkIdentifier;
    body: ArkStmt;
    constructor(body: ArkStmt, name?: ArkIdentifier) {
        super();
        this.name = name;
        this.body = body;
    }
}

export interface ArkClassExpression extends ArkAbstractExpression {
}



export class ArkUnaryExpression extends ArkAbstractExpression {
}


export class ArkNewExpression extends ArkUnaryExpression {
    expression: ArkExpression;
    args: ArkExpression[];
    constructor(expression: ArkExpression, args: ArkExpression[]) {
        super();
        this.expression = expression;
        this.args = args;
    }
}

export interface ArkDeleteExpression extends ArkUnaryExpression {
    readonly expression: ArkExpression;
}


export class ArkLiteralExpression extends ArkUnaryExpression {
    text: string;
    literalType: LiteralType;
    constructor(text: string, literalType: LiteralType) {
        super();
        this.text = text;
        this.literalType = literalType;
    }
}

export class ArkArrayLiteralExpression extends ArkUnaryExpression {
    elements: ArkExpression[];
    constructor(elements: ArkExpression[]) {
        super();
        this.elements = elements;
    }
}

export class ArkIdentifier extends ArkUnaryExpression {
    text: string;
    constructor(text: string) {
        super();
        this.text = text;
    }
}

export class ArkPrefixUnaryExpression extends ArkUnaryExpression {
    operator: PrefixUnaryOperator;
    operand: ArkExpression;
    constructor(operator: PrefixUnaryOperator, operand: ArkExpression) {
        super();
        this.operator = operator;
        this.operand = operand;
    }
}

export class ArkPostfixUnaryExpression extends ArkUnaryExpression {
    operator: PostfixUnaryOperator;
    operand: ArkExpression;
    constructor(operator: PostfixUnaryOperator, operand: ArkExpression) {
        super();
        this.operator = operator;
        this.operand = operand;
    }
}

export class ArkPropertyAccessExpression extends ArkUnaryExpression {
    expression: ArkExpression;
    questionDotToken: boolean;
    name: ArkIdentifier;
    constructor(expression: ArkExpression, questionDotToken: boolean, name: ArkIdentifier) {
        super();
        this.expression = expression;
        this.questionDotToken = questionDotToken;
        this.name = name;
    }
}

export class ArkElementAccessExpression extends ArkUnaryExpression {
    expression: ArkExpression;
    questionDotToken: boolean;
    argumentExpression: ArkExpression;
    constructor(expression: ArkExpression, questionDotToken: boolean, argumentExpression: ArkExpression) {
        super();
        this.expression = expression;
        this.questionDotToken = questionDotToken;
        this.argumentExpression = argumentExpression;
    }
}

export class ArkBinaryExpression extends ArkAbstractExpression {
    left: ArkExpression;
    binaryOperator: BinaryOperator;
    right: ArkExpression;
    constructor(left: ArkExpression, binaryOperator: BinaryOperator, right: ArkExpression) {
        super();
        this.left = left;
        this.right = right;
        this.binaryOperator = binaryOperator;
    }
}

export class ArkAssignmentExpression extends ArkBinaryExpression {
    binaryOperator: AssignmentOperator;
    constructor(left: ArkExpression, binaryOperator: AssignmentOperator, right: ArkExpression) {
        super(left, binaryOperator, right);
    }
}

export class ArkConditionalExpression extends ArkAbstractExpression {
    condition: ArkExpression;
    whenTrue: ArkExpression;
    whenFalse: ArkExpression;
    constructor(condition: ArkExpression, whenTrue: ArkExpression, whenFalse: ArkExpression) {
        super();
        this.condition = condition;
        this.whenTrue = whenTrue;
        this.whenFalse = whenFalse;
    }
}
