import ts from 'typescript';
import { buildModifiers } from '../../utils/builderUtils';

export class NamespaceInfo {
    private name: string;
    private modifiers: Set<string> = new Set<string>();

    constructor() {}

    public getName() {
        return this.name;
    }

    public setName(name:string) {
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
        namespaceInfo.setName(node.name.escapedText.toString());
    }
    return namespaceInfo;
}