[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ApplicableRefactorInfo

# Interface: ApplicableRefactorInfo

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6639

A set of one or more available refactoring actions, grouped under a parent refactoring.

## Properties

### actions

> **actions**: [`RefactorActionInfo`](RefactorActionInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6657

***

### description

> **description**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6648

A description of this refactoring category to show to the user.
If the refactoring gets inlined (see below), this text will not be visible.

***

### inlineable?

> `optional` **inlineable**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6656

Inlineable refactorings can have their actions hoisted out to the top level
of a context menu. Non-inlineanable refactorings should always be shown inside
their parent grouping.

If not specified, this value is assumed to be 'true'

***

### name

> **name**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6643

The programmatic name of the refactoring
