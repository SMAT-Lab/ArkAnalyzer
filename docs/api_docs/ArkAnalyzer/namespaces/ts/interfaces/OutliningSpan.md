[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / OutliningSpan

# Interface: OutliningSpan

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7055

## Properties

### autoCollapse

> **autoCollapse**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7066

Whether or not this region should be automatically collapsed when
the 'Collapse to Definitions' command is invoked.

***

### bannerText

> **bannerText**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7061

The text to display in the editor for the collapsed region.

***

### hintSpan

> **hintSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7059

The span of the document to display when the user hovers over the collapsed span.

***

### kind

> **kind**: [`OutliningSpanKind`](../enumerations/OutliningSpanKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7070

Classification of the contents of the span

***

### textSpan

> **textSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7057

The span of the document to actually collapse.
