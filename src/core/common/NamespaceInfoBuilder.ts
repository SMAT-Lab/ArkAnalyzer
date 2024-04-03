import ts from 'typescript';
import { buildModifiers } from '../../utils/builderUtils';
import Logger from "../../utils/logger";

const logger = Logger.getLogger();
export class NamespaceInfo {
    private name: string;
    private modifiers: Set<string> = new Set<string>();

    constructor() { }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(modifier: string) {
        this.modifiers.add(modifier);
    }
}

export function buildNamespaceInfo4NamespaceNode(node: ts.ModuleDeclaration): NamespaceInfo {
    let namespaceInfo = new NamespaceInfo();
    if (node.modifiers) {
        buildModifiers(node.modifiers).forEach((modifier) => {
            namespaceInfo.addModifier(modifier);
        });
    }
    if (ts.isIdentifier(node.name)) {
        namespaceInfo.setName(node.name.text);
    }
    else if (ts.isStringLiteral(node.name)) {
        namespaceInfo.setName(node.name.text);
    }
    else {
        logger.warn("New namespace name type found. Please contact developers to add support for this!")
    }
    return namespaceInfo;
}