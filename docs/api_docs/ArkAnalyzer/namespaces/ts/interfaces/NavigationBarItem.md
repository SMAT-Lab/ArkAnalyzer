[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / NavigationBarItem

# Interface: NavigationBarItem

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6532

Navigation bar interface designed for visual studio's dual-column layout.
This does not form a proper tree.
The navbar is returned as a list of top-level items, each of which has a list of child items.
Child items always have an empty array for their `childItems`.

## Properties

### bolded

> **bolded**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6539

***

### childItems

> **childItems**: `NavigationBarItem`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6537

***

### grayed

> **grayed**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6540

***

### indent

> **indent**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6538

***

### kind

> **kind**: [`ScriptElementKind`](../enumerations/ScriptElementKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6534

***

### kindModifiers

> **kindModifiers**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6535

***

### spans

> **spans**: [`TextSpan`](TextSpan.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6536

***

### text

> **text**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6533
