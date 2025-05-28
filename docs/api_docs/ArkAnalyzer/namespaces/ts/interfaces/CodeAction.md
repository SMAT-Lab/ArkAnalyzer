[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CodeAction

# Interface: CodeAction

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6608

## Extended by

- [`CodeFixAction`](CodeFixAction.md)

## Properties

### changes

> **changes**: [`FileTextChanges`](FileTextChanges.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6612

Text changes to apply to each file as part of the code action

***

### commands?

> `optional` **commands**: [`InstallPackageAction`](InstallPackageAction.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6617

If the user accepts the code fix, the editor should send the action back in a `applyAction` request.
This allows the language service to have side effects (e.g. installing dependencies) upon a code fix.

***

### description

> **description**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6610

Description of the code action to display in the UI of the editor
