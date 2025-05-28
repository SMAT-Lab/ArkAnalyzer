[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SignatureHelpRetriggeredReason

# Interface: SignatureHelpRetriggeredReason

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6504

Signals that this signature help request came from typing a character or moving the cursor.
This should only occur if a signature help session was already active and the editor needs to see if it should adjust.
The language service will unconditionally attempt to provide a result.
`triggerCharacter` can be `undefined` for a retrigger caused by a cursor move.

## Properties

### kind

> **kind**: `"retrigger"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6505

***

### triggerCharacter?

> `optional` **triggerCharacter**: [`SignatureHelpRetriggerCharacter`](../type-aliases/SignatureHelpRetriggerCharacter.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6509

Character that was responsible for triggering signature help.
