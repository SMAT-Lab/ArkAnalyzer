[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SignatureHelpCharacterTypedReason

# Interface: SignatureHelpCharacterTypedReason

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6491

Signals that the signature help request came from a user typing a character.
Depending on the character and the syntactic context, the request may or may not be served a result.

## Properties

### kind

> **kind**: `"characterTyped"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6492

***

### triggerCharacter

> **triggerCharacter**: [`SignatureHelpTriggerCharacter`](../type-aliases/SignatureHelpTriggerCharacter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6496

Character that was responsible for triggering signature help.
