[**ArkAnalyzer**](../../../../../../README.md)

***

[ArkAnalyzer](../../../../../../globals.md) / [ts](../../../README.md) / [server](../README.md) / ProjectResponse

# Interface: ProjectResponse

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6059

## Extends

- [`TypingInstallerResponse`](TypingInstallerResponse.md)

## Extended by

- [`PackageInstalledResponse`](PackageInstalledResponse.md)
- [`InvalidateCachedTypings`](InvalidateCachedTypings.md)
- [`InstallTypes`](InstallTypes.md)
- [`SetTypings`](SetTypings.md)

## Properties

### kind

> `readonly` **kind**: `"action::set"` \| `"action::invalidate"` \| `"event::typesRegistry"` \| `"action::packageInstalled"` \| `"event::beginInstallTypes"` \| `"event::endInstallTypes"` \| `"event::initializationFailed"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6022

#### Inherited from

[`TypingInstallerResponse`](TypingInstallerResponse.md).[`kind`](TypingInstallerResponse.md#kind)

***

### projectName

> `readonly` **projectName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6060
