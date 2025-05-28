[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / NavigationTree

# Interface: NavigationTree

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6546

Node in a tree of nested declarations in a file.
The top node is always a script or module node.

## Properties

### childItems?

> `optional` **childItems**: `NavigationTree`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6559

Present if non-empty

***

### kind

> **kind**: [`ScriptElementKind`](../enumerations/ScriptElementKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6549

***

### kindModifiers

> **kindModifiers**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6551

ScriptElementKindModifier separated by commas, e.g. "public,abstract"

***

### nameSpan

> **nameSpan**: `undefined` \| [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6557

***

### spans

> **spans**: [`TextSpan`](TextSpan.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6556

Spans of the nodes that generated this declaration.
There will be more than one if this is the result of merging.

***

### text

> **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6548

Name of the declaration, or a short description, e.g. "<class>".
