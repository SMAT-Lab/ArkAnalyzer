[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / IScriptSnapshot

# Interface: IScriptSnapshot

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6174

Represents an immutable snapshot of a script at a specified time.Once acquired, the
snapshot is observably immutable. i.e. the same calls with the same parameters will return
the same values.

## Methods

### dispose()?

> `optional` **dispose**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6188

Releases all resources held by this script snapshot

#### Returns

`void`

***

### getChangeRange()

> **getChangeRange**(`oldSnapshot`): `undefined` \| [`TextChangeRange`](TextChangeRange.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6186

Gets the TextChangeRange that describe how the text changed between this text and
an older version.  This information is used by the incremental parser to determine
what sections of the script need to be re-parsed.  'undefined' can be returned if the
change range cannot be determined.  However, in that case, incremental parsing will
not happen and the entire document will be re - parsed.

#### Parameters

##### oldSnapshot

`IScriptSnapshot`

#### Returns

`undefined` \| [`TextChangeRange`](TextChangeRange.md)

***

### getLength()

> **getLength**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6178

Gets the length of this script snapshot.

#### Returns

`number`

***

### getText()

> **getText**(`start`, `end`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6176

Gets a portion of the script snapshot specified by [start, end).

#### Parameters

##### start

`number`

##### end

`number`

#### Returns

`string`
