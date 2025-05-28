[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / CompletionInfo

# Interface: CompletionInfo

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6962

## Properties

### entries

> **entries**: [`CompletionEntry`](CompletionEntry.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6982

***

### flags?

> `optional` **flags**: [`CompletionInfoFlags`](../enumerations/CompletionInfoFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6964

For performance telemetry.

***

### isGlobalCompletion

> **isGlobalCompletion**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6966

Not true for all global completions. This will be true if the enclosing scope matches a few syntax kinds. See `isSnippetScope`.

***

### isIncomplete?

> `optional` **isIncomplete**: `true`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6981

Indicates to client to continue requesting completions on subsequent keystrokes.

***

### isMemberCompletion

> **isMemberCompletion**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6967

***

### isNewIdentifierLocation

> **isNewIdentifierLocation**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6977

true when the current location also allows for a new identifier

***

### optionalReplacementSpan?

> `optional` **optionalReplacementSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6973

In the absence of `CompletionEntry["replacementSpan"]`, the editor may choose whether to use
this span or its default one. If `CompletionEntry["replacementSpan"]` is defined, that span
must be used to commit that completion entry.
