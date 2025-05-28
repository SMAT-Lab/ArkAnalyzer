[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CodeFixAction

# Interface: CodeFixAction

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6619

## Extends

- [`CodeAction`](CodeAction.md)

## Properties

### changes

> **changes**: [`FileTextChanges`](FileTextChanges.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6612

Text changes to apply to each file as part of the code action

#### Inherited from

[`CodeAction`](CodeAction.md).[`changes`](CodeAction.md#changes)

***

### commands?

> `optional` **commands**: [`InstallPackageAction`](InstallPackageAction.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6617

If the user accepts the code fix, the editor should send the action back in a `applyAction` request.
This allows the language service to have side effects (e.g. installing dependencies) upon a code fix.

#### Inherited from

[`CodeAction`](CodeAction.md).[`commands`](CodeAction.md#commands)

***

### description

> **description**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6610

Description of the code action to display in the UI of the editor

#### Inherited from

[`CodeAction`](CodeAction.md).[`description`](CodeAction.md#description)

***

### fixAllDescription?

> `optional` **fixAllDescription**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6627

***

### fixId?

> `optional` **fixId**: `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6626

If present, one may call 'getCombinedCodeFix' with this fixId.
This may be omitted to indicate that the code fix can't be applied in a group.

***

### fixName

> **fixName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6621

Short name to identify the fix, for use by telemetry.
