import * as ts from "typescript";

export function buildModifiers(modifierArray: ts.NodeArray<ts.ModifierLike>): Set<string> {
    let modifiers: Set<string> = new Set<string>();
    modifierArray.forEach((modifier) => {
        //TODO: find reason!!
        //console.log(name, modifier.kind, ts.SyntaxKind.AbstractKeyword);
        if (ts.SyntaxKind[modifier.kind] == 'FirstContextualKeyword') {
            modifiers.add('AbstractKeyword');
        }
        else {
            modifiers.add(ts.SyntaxKind[modifier.kind]);
        }
    });
    return modifiers;
}