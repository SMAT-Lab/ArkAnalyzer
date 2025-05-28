[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / RefactorActionInfo

# Interface: RefactorActionInfo

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6663

Represents a single refactoring action - for example, the "Extract Method..." refactor might
offer several actions, each corresponding to a surround class or closure to extract into.

## Properties

### description

> **description**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6673

A description of this refactoring action to show to the user.
If the parent refactoring is inlined away, this will be the only text shown,
so this description should make sense by itself if the parent is inlineable=true

***

### kind?

> `optional` **kind**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6682

The hierarchical dotted name of the refactor action.

***

### name

> **name**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6667

The programmatic name of the refactoring action

***

### notApplicableReason?

> `optional` **notApplicableReason**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6678

A message to show to the user if the refactoring cannot be applied in
the current context.
