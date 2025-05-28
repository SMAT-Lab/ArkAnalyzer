[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DummyCallCreator

# Class: DummyCallCreator

Defined in: src/callgraph/pointerAnalysis/DummyCallCreator.ts:30

TODO: constructor pointer and cid

## Constructors

### Constructor

> **new DummyCallCreator**(`scene`): `DummyCallCreator`

Defined in: src/callgraph/pointerAnalysis/DummyCallCreator.ts:36

#### Parameters

##### scene

[`Scene`](Scene.md)

#### Returns

`DummyCallCreator`

## Methods

### getDummyCallByComponent()

> **getDummyCallByComponent**(`classSig`, `baseComponent`): `Set`\<[`Stmt`](Stmt.md)\>

Defined in: src/callgraph/pointerAnalysis/DummyCallCreator.ts:54

#### Parameters

##### classSig

[`ClassSignature`](ClassSignature.md)

##### baseComponent

[`Local`](Local.md)

#### Returns

`Set`\<[`Stmt`](Stmt.md)\>

***

### getDummyCallByPage()

> **getDummyCallByPage**(`classSig`, `basePage`): `Set`\<[`Stmt`](Stmt.md)\>

Defined in: src/callgraph/pointerAnalysis/DummyCallCreator.ts:42

#### Parameters

##### classSig

[`ClassSignature`](ClassSignature.md)

##### basePage

[`Local`](Local.md)

#### Returns

`Set`\<[`Stmt`](Stmt.md)\>
