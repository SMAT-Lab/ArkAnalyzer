[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / LanguageService

# Interface: LanguageService

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6270

## Methods

### applyCodeActionCommand()

#### Call Signature

> **applyCodeActionCommand**(`action`, `formatSettings?`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6411

##### Parameters

###### action

[`InstallPackageAction`](InstallPackageAction.md)

###### formatSettings?

[`FormatCodeSettings`](FormatCodeSettings.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

#### Call Signature

> **applyCodeActionCommand**(`action`, `formatSettings?`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6412

##### Parameters

###### action

[`InstallPackageAction`](InstallPackageAction.md)[]

###### formatSettings?

[`FormatCodeSettings`](FormatCodeSettings.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

#### Call Signature

> **applyCodeActionCommand**(`action`, `formatSettings?`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md) \| [`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6413

##### Parameters

###### action

[`InstallPackageAction`](InstallPackageAction.md) | [`InstallPackageAction`](InstallPackageAction.md)[]

###### formatSettings?

[`FormatCodeSettings`](FormatCodeSettings.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md) \| [`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

#### Call Signature

> **applyCodeActionCommand**(`fileName`, `action`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6415

##### Parameters

###### fileName

`string`

###### action

[`InstallPackageAction`](InstallPackageAction.md)

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)\>

##### Deprecated

`fileName` will be ignored

#### Call Signature

> **applyCodeActionCommand**(`fileName`, `action`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6417

##### Parameters

###### fileName

`string`

###### action

[`InstallPackageAction`](InstallPackageAction.md)[]

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

##### Deprecated

`fileName` will be ignored

#### Call Signature

> **applyCodeActionCommand**(`fileName`, `action`): `Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md) \| [`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6419

##### Parameters

###### fileName

`string`

###### action

[`InstallPackageAction`](InstallPackageAction.md) | [`InstallPackageAction`](InstallPackageAction.md)[]

##### Returns

`Promise`\<[`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md) \| [`ApplyCodeActionCommandResult`](ApplyCodeActionCommandResult.md)[]\>

##### Deprecated

`fileName` will be ignored

***

### cleanupSemanticCache()

> **cleanupSemanticCache**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6272

This is used as a part of restarting the language service.

#### Returns

`void`

***

### commentSelection()

> **commentSelection**(`fileName`, `textRange`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6429

#### Parameters

##### fileName

`string`

##### textRange

[`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### dispose()

> **dispose**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6431

#### Returns

`void`

***

### findReferences()

> **findReferences**(`fileName`, `position`): `undefined` \| [`ReferencedSymbol`](ReferencedSymbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6381

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| [`ReferencedSymbol`](ReferencedSymbol.md)[]

***

### findRenameLocations()

> **findRenameLocations**(`fileName`, `position`, `findInStrings`, `findInComments`, `providePrefixAndSuffixTextForRename?`): `undefined` \| readonly [`RenameLocation`](RenameLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6374

#### Parameters

##### fileName

`string`

##### position

`number`

##### findInStrings

`boolean`

##### findInComments

`boolean`

##### providePrefixAndSuffixTextForRename?

`boolean`

#### Returns

`undefined` \| readonly [`RenameLocation`](RenameLocation.md)[]

***

### getApplicableRefactors()

> **getApplicableRefactors**(`fileName`, `positionOrRange`, `preferences`, `triggerReason?`, `kind?`): [`ApplicableRefactorInfo`](ApplicableRefactorInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6420

#### Parameters

##### fileName

`string`

##### positionOrRange

`number` | [`TextRange`](TextRange.md)

##### preferences

`undefined` | [`UserPreferences`](UserPreferences.md)

##### triggerReason?

[`RefactorTriggerReason`](../type-aliases/RefactorTriggerReason.md)

##### kind?

`string`

#### Returns

[`ApplicableRefactorInfo`](ApplicableRefactorInfo.md)[]

***

### getBraceMatchingAtPosition()

> **getBraceMatchingAtPosition**(`fileName`, `position`): [`TextSpan`](TextSpan.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6395

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

[`TextSpan`](TextSpan.md)[]

***

### getBreakpointStatementAtPosition()

> **getBreakpointStatementAtPosition**(`fileName`, `position`): `undefined` \| [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6369

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| [`TextSpan`](TextSpan.md)

***

### getBuilderProgram()

> **getBuilderProgram**(): `undefined` \| [`BuilderProgram`](BuilderProgram.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6426

#### Returns

`undefined` \| [`BuilderProgram`](BuilderProgram.md)

***

### getCodeFixesAtPosition()

> **getCodeFixesAtPosition**(`fileName`, `start`, `end`, `errorCodes`, `formatOptions`, `preferences`): readonly [`CodeFixAction`](CodeFixAction.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6409

#### Parameters

##### fileName

`string`

##### start

`number`

##### end

`number`

##### errorCodes

readonly `number`[]

##### formatOptions

[`FormatCodeSettings`](FormatCodeSettings.md)

##### preferences

[`UserPreferences`](UserPreferences.md)

#### Returns

readonly [`CodeFixAction`](CodeFixAction.md)[]

***

### getCombinedCodeFix()

> **getCombinedCodeFix**(`scope`, `fixId`, `formatOptions`, `preferences`): [`CombinedCodeActions`](CombinedCodeActions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6410

#### Parameters

##### scope

[`CombinedCodeFixScope`](CombinedCodeFixScope.md)

##### fixId

##### formatOptions

[`FormatCodeSettings`](FormatCodeSettings.md)

##### preferences

[`UserPreferences`](UserPreferences.md)

#### Returns

[`CombinedCodeActions`](CombinedCodeActions.md)

***

### getCompilerOptionsDiagnostics()

> **getCompilerOptionsDiagnostics**(): [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6318

Gets global diagnostics related to the program configuration and compiler options.

#### Returns

[`Diagnostic`](Diagnostic.md)[]

***

### getCompletionEntryDetails()

> **getCompletionEntryDetails**(`fileName`, `position`, `entryName`, `formatOptions`, `source`, `preferences`, `data`): `undefined` \| [`CompletionEntryDetails`](CompletionEntryDetails.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6358

Gets the extended details for a completion entry retrieved from `getCompletionsAtPosition`.

#### Parameters

##### fileName

`string`

The path to the file

##### position

`number`

A zero based index of the character where you want the entries

##### entryName

`string`

The `name` from an existing completion which came from `getCompletionsAtPosition`

##### formatOptions

How should code samples in the completions be formatted, can be undefined for backwards compatibility

`undefined` | [`FormatCodeSettings`](FormatCodeSettings.md) | [`FormatCodeOptions`](FormatCodeOptions.md)

##### source

`source` property from the completion entry

`undefined` | `string`

##### preferences

User settings, can be undefined for backwards compatibility

`undefined` | [`UserPreferences`](UserPreferences.md)

##### data

`data` property from the completion entry

`undefined` | [`CompletionEntryData`](../type-aliases/CompletionEntryData.md)

#### Returns

`undefined` \| [`CompletionEntryDetails`](CompletionEntryDetails.md)

***

### getCompletionEntrySymbol()

> **getCompletionEntrySymbol**(`fileName`, `position`, `name`, `source`): `undefined` \| [`Symbol`](Symbol.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6359

#### Parameters

##### fileName

`string`

##### position

`number`

##### name

`string`

##### source

`undefined` | `string`

#### Returns

`undefined` \| [`Symbol`](Symbol.md)

***

### getCompletionsAtPosition()

> **getCompletionsAtPosition**(`fileName`, `position`, `options`, `formattingSettings?`): `undefined` \| [`WithMetadata`](../type-aliases/WithMetadata.md)\<[`CompletionInfo`](CompletionInfo.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6346

Gets completion entries at a particular position in a file.

#### Parameters

##### fileName

`string`

The path to the file

##### position

`number`

A zero-based index of the character where you want the entries

##### options

An object describing how the request was triggered and what kinds
of code actions can be returned with the completions.

`undefined` | [`GetCompletionsAtPositionOptions`](GetCompletionsAtPositionOptions.md)

##### formattingSettings?

[`FormatCodeSettings`](FormatCodeSettings.md)

settings needed for calling formatting functions.

#### Returns

`undefined` \| [`WithMetadata`](../type-aliases/WithMetadata.md)\<[`CompletionInfo`](CompletionInfo.md)\>

***

### getDefinitionAndBoundSpan()

> **getDefinitionAndBoundSpan**(`fileName`, `position`): `undefined` \| [`DefinitionInfoAndBoundSpan`](DefinitionInfoAndBoundSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6377

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| [`DefinitionInfoAndBoundSpan`](DefinitionInfoAndBoundSpan.md)

***

### getDefinitionAtPosition()

> **getDefinitionAtPosition**(`fileName`, `position`): `undefined` \| readonly [`DefinitionInfo`](DefinitionInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6376

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| readonly [`DefinitionInfo`](DefinitionInfo.md)[]

***

### getDocCommentTemplateAtPosition()

> **getDocCommentTemplateAtPosition**(`fileName`, `position`, `options?`): `undefined` \| [`TextInsertion`](TextInsertion.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6400

#### Parameters

##### fileName

`string`

##### position

`number`

##### options?

[`DocCommentTemplateOptions`](DocCommentTemplateOptions.md)

#### Returns

`undefined` \| [`TextInsertion`](TextInsertion.md)

***

### getDocumentHighlights()

> **getDocumentHighlights**(`fileName`, `position`, `filesToSearch`): `undefined` \| [`DocumentHighlights`](DocumentHighlights.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6382

#### Parameters

##### fileName

`string`

##### position

`number`

##### filesToSearch

`string`[]

#### Returns

`undefined` \| [`DocumentHighlights`](DocumentHighlights.md)[]

***

### getEditsForFileRename()

> **getEditsForFileRename**(`oldFilePath`, `newFilePath`, `formatOptions`, `preferences`): readonly [`FileTextChanges`](FileTextChanges.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6423

#### Parameters

##### oldFilePath

`string`

##### newFilePath

`string`

##### formatOptions

[`FormatCodeSettings`](FormatCodeSettings.md)

##### preferences

`undefined` | [`UserPreferences`](UserPreferences.md)

#### Returns

readonly [`FileTextChanges`](FileTextChanges.md)[]

***

### getEditsForRefactor()

> **getEditsForRefactor**(`fileName`, `formatOptions`, `positionOrRange`, `refactorName`, `actionName`, `preferences`): `undefined` \| [`RefactorEditInfo`](RefactorEditInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6421

#### Parameters

##### fileName

`string`

##### formatOptions

[`FormatCodeSettings`](FormatCodeSettings.md)

##### positionOrRange

`number` | [`TextRange`](TextRange.md)

##### refactorName

`string`

##### actionName

`string`

##### preferences

`undefined` | [`UserPreferences`](UserPreferences.md)

#### Returns

`undefined` \| [`RefactorEditInfo`](RefactorEditInfo.md)

***

### getEmitOutput()

> **getEmitOutput**(`fileName`, `emitOnlyDtsFiles?`, `forceDtsEmit?`): [`EmitOutput`](EmitOutput.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6424

#### Parameters

##### fileName

`string`

##### emitOnlyDtsFiles?

`boolean`

##### forceDtsEmit?

`boolean`

#### Returns

[`EmitOutput`](EmitOutput.md)

***

### getEncodedSemanticClassifications()

> **getEncodedSemanticClassifications**(`fileName`, `span`, `format?`): [`Classifications`](Classifications.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6336

Gets semantic highlights information for a particular file. Has two formats, an older
version used by VS and a format used by VS Code.

#### Parameters

##### fileName

`string`

The path to the file

##### span

[`TextSpan`](TextSpan.md)

##### format?

[`SemanticClassificationFormat`](../enumerations/SemanticClassificationFormat.md)

Which format to use, defaults to "original"

#### Returns

[`Classifications`](Classifications.md)

a number array encoded as triples of [start, length, ClassificationType, ...].

***

### getEncodedSyntacticClassifications()

> **getEncodedSyntacticClassifications**(`fileName`, `span`): [`Classifications`](Classifications.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6326

Encoded as triples of [start, length, ClassificationType].

#### Parameters

##### fileName

`string`

##### span

[`TextSpan`](TextSpan.md)

#### Returns

[`Classifications`](Classifications.md)

***

### getFileReferences()

> **getFileReferences**(`fileName`): [`ReferenceEntry`](ReferenceEntry.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6383

#### Parameters

##### fileName

`string`

#### Returns

[`ReferenceEntry`](ReferenceEntry.md)[]

***

### getFormattingEditsAfterKeystroke()

> **getFormattingEditsAfterKeystroke**(`fileName`, `position`, `key`, `options`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6399

#### Parameters

##### fileName

`string`

##### position

`number`

##### key

`string`

##### options

[`FormatCodeSettings`](FormatCodeSettings.md) | [`FormatCodeOptions`](FormatCodeOptions.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### getFormattingEditsForDocument()

> **getFormattingEditsForDocument**(`fileName`, `options`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6398

#### Parameters

##### fileName

`string`

##### options

[`FormatCodeSettings`](FormatCodeSettings.md) | [`FormatCodeOptions`](FormatCodeOptions.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### getFormattingEditsForRange()

> **getFormattingEditsForRange**(`fileName`, `start`, `end`, `options`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6397

#### Parameters

##### fileName

`string`

##### start

`number`

##### end

`number`

##### options

[`FormatCodeSettings`](FormatCodeSettings.md) | [`FormatCodeOptions`](FormatCodeOptions.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### getImplementationAtPosition()

> **getImplementationAtPosition**(`fileName`, `position`): `undefined` \| readonly [`ImplementationLocation`](ImplementationLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6379

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| readonly [`ImplementationLocation`](ImplementationLocation.md)[]

***

### getIndentationAtPosition()

> **getIndentationAtPosition**(`fileName`, `position`, `options`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6396

#### Parameters

##### fileName

`string`

##### position

`number`

##### options

[`EditorSettings`](EditorSettings.md) | [`EditorOptions`](EditorOptions.md)

#### Returns

`number`

***

### getJsxClosingTagAtPosition()

> **getJsxClosingTagAtPosition**(`fileName`, `position`): `undefined` \| [`JsxClosingTagInfo`](JsxClosingTagInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6406

This will return a defined result if the position is after the `>` of the opening tag, or somewhere in the text, of a JSXElement with no closing tag.
Editors should call this after `>` is typed.

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| [`JsxClosingTagInfo`](JsxClosingTagInfo.md)

***

### getNameOrDottedNameSpan()

> **getNameOrDottedNameSpan**(`fileName`, `startPos`, `endPos`): `undefined` \| [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6368

#### Parameters

##### fileName

`string`

##### startPos

`number`

##### endPos

`number`

#### Returns

`undefined` \| [`TextSpan`](TextSpan.md)

***

### getNavigateToItems()

> **getNavigateToItems**(`searchValue`, `maxResultCount?`, `fileName?`, `excludeDtsFiles?`): [`NavigateToItem`](NavigateToItem.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6386

#### Parameters

##### searchValue

`string`

##### maxResultCount?

`number`

##### fileName?

`string`

##### excludeDtsFiles?

`boolean`

#### Returns

[`NavigateToItem`](NavigateToItem.md)[]

***

### getNavigationBarItems()

> **getNavigationBarItems**(`fileName`): [`NavigationBarItem`](NavigationBarItem.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6387

#### Parameters

##### fileName

`string`

#### Returns

[`NavigationBarItem`](NavigationBarItem.md)[]

***

### getNavigationTree()

> **getNavigationTree**(`fileName`): [`NavigationTree`](NavigationTree.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6388

#### Parameters

##### fileName

`string`

#### Returns

[`NavigationTree`](NavigationTree.md)

***

### ~~getOccurrencesAtPosition()~~

> **getOccurrencesAtPosition**(`fileName`, `position`): `undefined` \| readonly [`ReferenceEntry`](ReferenceEntry.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6385

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| readonly [`ReferenceEntry`](ReferenceEntry.md)[]

#### Deprecated

***

### getOutliningSpans()

> **getOutliningSpans**(`fileName`): [`OutliningSpan`](OutliningSpan.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6393

#### Parameters

##### fileName

`string`

#### Returns

[`OutliningSpan`](OutliningSpan.md)[]

***

### getProgram()

> **getProgram**(): `undefined` \| [`Program`](Program.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6425

#### Returns

`undefined` \| [`Program`](Program.md)

***

### getProps()?

> `optional` **getProps**(): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6433

#### Returns

`string`[]

***

### getQuickInfoAtPosition()

> **getQuickInfoAtPosition**(`fileName`, `position`): `undefined` \| [`QuickInfo`](QuickInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6367

Gets semantic information about the identifier at a particular position in a
file. Quick info is what you typically see when you hover in an editor.

#### Parameters

##### fileName

`string`

The path to the file

##### position

`number`

A zero-based index of the character where you want the quick info

#### Returns

`undefined` \| [`QuickInfo`](QuickInfo.md)

***

### getReferencesAtPosition()

> **getReferencesAtPosition**(`fileName`, `position`): `undefined` \| [`ReferenceEntry`](ReferenceEntry.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6380

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| [`ReferenceEntry`](ReferenceEntry.md)[]

***

### getRenameInfo()

#### Call Signature

> **getRenameInfo**(`fileName`, `position`, `preferences`): [`RenameInfo`](../type-aliases/RenameInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6371

##### Parameters

###### fileName

`string`

###### position

`number`

###### preferences

[`UserPreferences`](UserPreferences.md)

##### Returns

[`RenameInfo`](../type-aliases/RenameInfo.md)

#### Call Signature

> **getRenameInfo**(`fileName`, `position`, `options?`): [`RenameInfo`](../type-aliases/RenameInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6373

##### Parameters

###### fileName

`string`

###### position

`number`

###### options?

[`RenameInfoOptions`](RenameInfoOptions.md)

##### Returns

[`RenameInfo`](../type-aliases/RenameInfo.md)

##### Deprecated

Use the signature with `UserPreferences` instead.

***

### getSemanticClassifications()

#### Call Signature

> **getSemanticClassifications**(`fileName`, `span`): [`ClassifiedSpan`](ClassifiedSpan.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6323

##### Parameters

###### fileName

`string`

###### span

[`TextSpan`](TextSpan.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[]

##### Deprecated

Use getEncodedSemanticClassifications instead.

#### Call Signature

> **getSemanticClassifications**(`fileName`, `span`, `format`): [`ClassifiedSpan`](ClassifiedSpan.md)[] \| [`ClassifiedSpan2020`](ClassifiedSpan2020.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6324

##### Parameters

###### fileName

`string`

###### span

[`TextSpan`](TextSpan.md)

###### format

[`SemanticClassificationFormat`](../enumerations/SemanticClassificationFormat.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[] \| [`ClassifiedSpan2020`](ClassifiedSpan2020.md)[]

***

### getSemanticDiagnostics()

> **getSemanticDiagnostics**(`fileName`): [`Diagnostic`](Diagnostic.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6306

Gets warnings or errors indicating type system issues in a given file.
Requesting semantic diagnostics may start up the type system and
run deferred work, so the first call may take longer than subsequent calls.

Unlike the other get*Diagnostics functions, these diagnostics can potentially not
include a reference to a source file. Specifically, the first time this is called,
it will return global diagnostics with no associated location.

To contrast the differences between semantic and syntactic diagnostics, consider the
sentence: "The sun is green." is syntactically correct; those are real English words with
correct sentence structure. However, it is semantically invalid, because it is not true.

#### Parameters

##### fileName

`string`

A path to the file you want semantic diagnostics for

#### Returns

[`Diagnostic`](Diagnostic.md)[]

***

### getSignatureHelpItems()

> **getSignatureHelpItems**(`fileName`, `position`, `options`): `undefined` \| [`SignatureHelpItems`](SignatureHelpItems.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6370

#### Parameters

##### fileName

`string`

##### position

`number`

##### options

`undefined` | [`SignatureHelpItemsOptions`](SignatureHelpItemsOptions.md)

#### Returns

`undefined` \| [`SignatureHelpItems`](SignatureHelpItems.md)

***

### getSmartSelectionRange()

> **getSmartSelectionRange**(`fileName`, `position`): [`SelectionRange`](SelectionRange.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6375

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

[`SelectionRange`](SelectionRange.md)

***

### getSpanOfEnclosingComment()

> **getSpanOfEnclosingComment**(`fileName`, `position`, `onlyMultiLine`): `undefined` \| [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6407

#### Parameters

##### fileName

`string`

##### position

`number`

##### onlyMultiLine

`boolean`

#### Returns

`undefined` \| [`TextSpan`](TextSpan.md)

***

### getSuggestionDiagnostics()

> **getSuggestionDiagnostics**(`fileName`): [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6314

Gets suggestion diagnostics for a specific file. These diagnostics tend to
proactively suggest refactors, as opposed to diagnostics that indicate
potentially incorrect runtime behavior.

#### Parameters

##### fileName

`string`

A path to the file you want semantic diagnostics for

#### Returns

[`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

***

### getSyntacticClassifications()

#### Call Signature

> **getSyntacticClassifications**(`fileName`, `span`): [`ClassifiedSpan`](ClassifiedSpan.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6320

##### Parameters

###### fileName

`string`

###### span

[`TextSpan`](TextSpan.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[]

##### Deprecated

Use getEncodedSyntacticClassifications instead.

#### Call Signature

> **getSyntacticClassifications**(`fileName`, `span`, `format`): [`ClassifiedSpan`](ClassifiedSpan.md)[] \| [`ClassifiedSpan2020`](ClassifiedSpan2020.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6321

##### Parameters

###### fileName

`string`

###### span

[`TextSpan`](TextSpan.md)

###### format

[`SemanticClassificationFormat`](../enumerations/SemanticClassificationFormat.md)

##### Returns

[`ClassifiedSpan`](ClassifiedSpan.md)[] \| [`ClassifiedSpan2020`](ClassifiedSpan2020.md)[]

***

### getSyntacticDiagnostics()

> **getSyntacticDiagnostics**(`fileName`): [`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6290

Gets errors indicating invalid syntax in a file.

In English, "this cdeo have, erorrs" is syntactically invalid because it has typos,
grammatical errors, and misplaced punctuation. Likewise, examples of syntax
errors in TypeScript are missing parentheses in an `if` statement, mismatched
curly braces, and using a reserved keyword as a variable name.

These diagnostics are inexpensive to compute and don't require knowledge of
other files. Note that a non-empty result increases the likelihood of false positives
from `getSemanticDiagnostics`.

While these represent the majority of syntax-related diagnostics, there are some
that require the type system, which will be present in `getSemanticDiagnostics`.

#### Parameters

##### fileName

`string`

A path to the file you want syntactic diagnostics for

#### Returns

[`DiagnosticWithLocation`](DiagnosticWithLocation.md)[]

***

### getTodoComments()

> **getTodoComments**(`fileName`, `descriptors`): [`TodoComment`](TodoComment.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6394

#### Parameters

##### fileName

`string`

##### descriptors

[`TodoCommentDescriptor`](TodoCommentDescriptor.md)[]

#### Returns

[`TodoComment`](TodoComment.md)[]

***

### getTypeDefinitionAtPosition()

> **getTypeDefinitionAtPosition**(`fileName`, `position`): `undefined` \| readonly [`DefinitionInfo`](DefinitionInfo.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6378

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| readonly [`DefinitionInfo`](DefinitionInfo.md)[]

***

### isValidBraceCompletionAtPosition()

> **isValidBraceCompletionAtPosition**(`fileName`, `position`, `openingBrace`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6401

#### Parameters

##### fileName

`string`

##### position

`number`

##### openingBrace

`number`

#### Returns

`boolean`

***

### organizeImports()

> **organizeImports**(`args`, `formatOptions`, `preferences`): readonly [`FileTextChanges`](FileTextChanges.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6422

#### Parameters

##### args

[`OrganizeImportsArgs`](OrganizeImportsArgs.md)

##### formatOptions

[`FormatCodeSettings`](FormatCodeSettings.md)

##### preferences

`undefined` | [`UserPreferences`](UserPreferences.md)

#### Returns

readonly [`FileTextChanges`](FileTextChanges.md)[]

***

### prepareCallHierarchy()

> **prepareCallHierarchy**(`fileName`, `position`): `undefined` \| [`CallHierarchyItem`](CallHierarchyItem.md) \| [`CallHierarchyItem`](CallHierarchyItem.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6389

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

`undefined` \| [`CallHierarchyItem`](CallHierarchyItem.md) \| [`CallHierarchyItem`](CallHierarchyItem.md)[]

***

### provideCallHierarchyIncomingCalls()

> **provideCallHierarchyIncomingCalls**(`fileName`, `position`): [`CallHierarchyIncomingCall`](CallHierarchyIncomingCall.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6390

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

[`CallHierarchyIncomingCall`](CallHierarchyIncomingCall.md)[]

***

### provideCallHierarchyOutgoingCalls()

> **provideCallHierarchyOutgoingCalls**(`fileName`, `position`): [`CallHierarchyOutgoingCall`](CallHierarchyOutgoingCall.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6391

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

[`CallHierarchyOutgoingCall`](CallHierarchyOutgoingCall.md)[]

***

### provideInlayHints()

> **provideInlayHints**(`fileName`, `span`, `preferences`): [`InlayHint`](InlayHint.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6392

#### Parameters

##### fileName

`string`

##### span

[`TextSpan`](TextSpan.md)

##### preferences

`undefined` | [`UserPreferences`](UserPreferences.md)

#### Returns

[`InlayHint`](InlayHint.md)[]

***

### toggleLineComment()

> **toggleLineComment**(`fileName`, `textRange`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6427

#### Parameters

##### fileName

`string`

##### textRange

[`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### toggleMultilineComment()

> **toggleMultilineComment**(`fileName`, `textRange`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6428

#### Parameters

##### fileName

`string`

##### textRange

[`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### toLineColumnOffset()?

> `optional` **toLineColumnOffset**(`fileName`, `position`): [`LineAndCharacter`](LineAndCharacter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6408

#### Parameters

##### fileName

`string`

##### position

`number`

#### Returns

[`LineAndCharacter`](LineAndCharacter.md)

***

### uncommentSelection()

> **uncommentSelection**(`fileName`, `textRange`): [`TextChange`](TextChange.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6430

#### Parameters

##### fileName

`string`

##### textRange

[`TextRange`](TextRange.md)

#### Returns

[`TextChange`](TextChange.md)[]

***

### updateRootFiles()?

> `optional` **updateRootFiles**(`rootFiles`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6432

#### Parameters

##### rootFiles

`string`[]

#### Returns

`void`
