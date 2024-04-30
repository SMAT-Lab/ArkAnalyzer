import * as ts from 'typescript';
import * as fs from 'fs';
import path from 'path';
import Logger from './logger';
const logger = Logger.getLogger();

export function fetchDependenciesFromFile(filePath: string): Map<string, string> {
    const map: Map<string, string> = new Map();
    if (!fs.existsSync(filePath)) {
        return map;
    }
    const dependencies = parseJsonText(fs.readFileSync(filePath, 'utf-8')).dependencies;
    if (dependencies instanceof Object) {
        Object.entries(dependencies).forEach(([key, value]) => {
            const item: string = (value as string);
            const start: number = item.indexOf('..');
            if (start > -1) {
                map.set(key, path.resolve(filePath, item.substring(start)))
            }
        });
    }
    return map;
}

export function parseJsonText(text: string): { [k: string]: unknown } {
    const file = ts.parseJsonText('', text);
    const rootObjectLiteralExpression = getRootObjectLiteral(file);
    if (!rootObjectLiteralExpression) {
        return {};
    }
    return parseObjectLiteralExpression(rootObjectLiteralExpression, file);
}

function getRootObjectLiteral(file: ts.JsonSourceFile): ts.ObjectLiteralExpression | undefined {
    if (!file.statements || !file.statements.length) {
        logger.error('The JSON5 file format is incorrect, the root node statements is empty.');
        return undefined;
    }
    const expressionStatement = file.statements[0];
    if (expressionStatement.kind !== ts.SyntaxKind.ExpressionStatement) {
        logger.error(`The JSON5 file format is incorrect, the first child node is not ExpressionStatement. kind: ${expressionStatement.kind}`);
        return undefined;
    }
    const rootObjectLiteralExpression = (expressionStatement as ts.ExpressionStatement).expression;
    if (!rootObjectLiteralExpression) {
        logger.error('The JSON5 file format is incorrect, the first child node is empty.')
        return undefined;
    }

    if (rootObjectLiteralExpression.kind === ts.SyntaxKind.ObjectLiteralExpression) {
        return rootObjectLiteralExpression as ts.ObjectLiteralExpression;
    }

    if (rootObjectLiteralExpression.kind === ts.SyntaxKind.ArrayLiteralExpression) {
        const elements = (rootObjectLiteralExpression as ts.ArrayLiteralExpression).elements;
        if (elements && elements.length && elements[0].kind === ts.SyntaxKind.ObjectLiteralExpression) {
            return elements[0] as ts.ObjectLiteralExpression;
        }
        logger.error('The JSON5 file format is incorrect, the node ArrayLiteralExpression first element is not ObjectLiteralExpression.');
    }
    logger.error('The JSON5 file format is incorrect.');
    return undefined;
}

function parsePropertyInitializer(node: ts.Expression, file: ts.JsonSourceFile): unknown {
    if (node.kind === ts.SyntaxKind.StringLiteral) {
        return (node as ts.StringLiteral).text;
    } else if (node.kind === ts.SyntaxKind.NumericLiteral) {
        return (node as ts.NumericLiteral).text;
    } else if (node.kind === ts.SyntaxKind.PrefixUnaryExpression) {
        return (node as ts.PrefixUnaryExpression).getText(file);
    } else if (node.kind === ts.SyntaxKind.ArrayLiteralExpression) {
        return parseArrayLiteral(node, file);
    } else if (node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
        return parseObjectLiteralExpression(node as ts.ObjectLiteralExpression, file);
    } else if (node.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
    } else if (node.kind === ts.SyntaxKind.FalseKeyword) {
        return false;
    }
    return undefined;
}

function parseArrayLiteral(node: ts.Expression, file: ts.JsonSourceFile) {
    const res: unknown[] = [];
    (node as ts.ArrayLiteralExpression).elements.forEach(n => {
        res.push(parsePropertyInitializer(n, file));
    })
    return res;
}

function parseObjectLiteralExpression(ObjectLiteralExpression: ts.ObjectLiteralExpression, file: ts.JsonSourceFile): { [k: string]: unknown } {
    const res: { [k: string]: unknown } = {};
    ObjectLiteralExpression.properties.forEach(node => {
        const propNode = node as ts.PropertyAssignment;
        const key = (propNode.name as ts.Identifier).text;
        const value = parsePropertyInitializer(propNode.initializer, file);
        res[key] = value;
    })
    return res;
}

