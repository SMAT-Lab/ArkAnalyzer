[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkFile

# Class: ArkFile

Defined in: src/core/model/ArkFile.ts:54

## Constructors

### Constructor

> **new ArkFile**(`language`): `ArkFile`

Defined in: src/core/model/ArkFile.ts:78

#### Parameters

##### language

`Language`

#### Returns

`ArkFile`

## Methods

### addArkClass()

> **addArkClass**(`arkClass`): `void`

Defined in: src/core/model/ArkFile.ts:161

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`void`

***

### addExportInfo()

> **addExportInfo**(`exportInfo`, `key?`): `void`

Defined in: src/core/model/ArkFile.ts:304

#### Parameters

##### exportInfo

[`ExportInfo`](ExportInfo.md)

##### key?

`string`

#### Returns

`void`

***

### addImportInfo()

> **addImportInfo**(`importInfo`): `void`

Defined in: src/core/model/ArkFile.ts:221

#### Parameters

##### importInfo

[`ImportInfo`](ImportInfo.md)

#### Returns

`void`

***

### addNamespace()

> **addNamespace**(`namespace`): `void`

Defined in: src/core/model/ArkFile.ts:204

#### Parameters

##### namespace

[`ArkNamespace`](ArkNamespace.md)

#### Returns

`void`

***

### getAllNamespacesUnderThisFile()

> **getAllNamespacesUnderThisFile**(): [`ArkNamespace`](ArkNamespace.md)[]

Defined in: src/core/model/ArkFile.ts:344

#### Returns

[`ArkNamespace`](ArkNamespace.md)[]

***

### getAnonymousClassNumber()

> **getAnonymousClassNumber**(): `number`

Defined in: src/core/model/ArkFile.ts:353

#### Returns

`number`

***

### getClass()

> **getClass**(`classSignature`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkFile.ts:191

Returns the class based on its class signature. If the class could not be found, **null** will be returned.

#### Parameters

##### classSignature

[`ClassSignature`](ClassSignature.md)

the class signature.

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

A class. If there is no class, the return will be a **null**.

***

### getClasses()

> **getClasses**(): [`ArkClass`](ArkClass.md)[]

Defined in: src/core/model/ArkFile.ts:200

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getClassWithName()

> **getClassWithName**(`Class`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkFile.ts:196

#### Parameters

##### Class

`string`

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

***

### getCode()

> **getCode**(): `string`

Defined in: src/core/model/ArkFile.ts:157

Returns the codes of file as a **string.**

#### Returns

`string`

the codes of file.

***

### getDefaultClass()

> **getDefaultClass**(): [`ArkClass`](ArkClass.md)

Defined in: src/core/model/ArkFile.ts:165

#### Returns

[`ArkClass`](ArkClass.md)

***

### getExportInfoBy()

> **getExportInfoBy**(`name`): `undefined` \| [`ExportInfo`](ExportInfo.md)

Defined in: src/core/model/ArkFile.ts:279

Find out the [ExportInfo](ExportInfo.md) of this ArkFile by the given export name.
It returns an [ExportInfo](ExportInfo.md) or 'undefined' if it failed to find.

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`ExportInfo`](ExportInfo.md)

#### Example

```typescript
// abc.ts ArkFile
export class A {
...
}

export namespace B {
export namespace C {
export class D {}
}
}

// xyz.ts call getExportInfoBy
let arkFile = scene.getFile(fileSignature);

// a is the export class A defined in abc.ts
let a = arkFile.getExportInfoBy('A');

// b is the export class D within namespace C defined in abc.ts
let b = arkFile.getExportInfoBy('B.C.D');
```

***

### getExportInfos()

> **getExportInfos**(): [`ExportInfo`](ExportInfo.md)[]

Defined in: src/core/model/ArkFile.ts:241

#### Returns

[`ExportInfo`](ExportInfo.md)[]

***

### getFilePath()

> **getFilePath**(): `string`

Defined in: src/core/model/ArkFile.ts:141

Get a file path.

#### Returns

`string`

The absolute file path.

#### Example

1. Read source code based on file path.

```typescript
let str = fs.readFileSync(arkFile.getFilePath(), 'utf8');
```

***

### getFileSignature()

> **getFileSignature**(): [`FileSignature`](FileSignature.md)

Defined in: src/core/model/ArkFile.ts:336

Returns the file signature of this file. A file signature consists of project's name and file's name.

#### Returns

[`FileSignature`](FileSignature.md)

The file signature of this file.

***

### getImportInfoBy()

> **getImportInfoBy**(`name`): `undefined` \| [`ImportInfo`](ImportInfo.md)

Defined in: src/core/model/ArkFile.ts:217

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`ImportInfo`](ImportInfo.md)

***

### getImportInfos()

> **getImportInfos**(): [`ImportInfo`](ImportInfo.md)[]

Defined in: src/core/model/ArkFile.ts:213

Returns an **array** of import information.
The import information includes: clause's name, type, modifiers, location where it is imported from, etc.

#### Returns

[`ImportInfo`](ImportInfo.md)[]

An **array** of import information.

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkFile.ts:85

Returns the program language of the file.

#### Returns

`Language`

***

### getModuleName()

> **getModuleName**(): `undefined` \| `string`

Defined in: src/core/model/ArkFile.ts:320

#### Returns

`undefined` \| `string`

***

### getModuleScene()

> **getModuleScene**(): `undefined` \| `ModuleScene`

Defined in: src/core/model/ArkFile.ts:115

#### Returns

`undefined` \| `ModuleScene`

***

### getName()

> **getName**(): `string`

Defined in: src/core/model/ArkFile.ts:97

Returns the **string** name of the file, which also acts as the file's relative path.

#### Returns

`string`

The file's name (also means its relative path).

***

### getNamespace()

> **getNamespace**(`namespaceSignature`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/model/ArkFile.ts:173

#### Parameters

##### namespaceSignature

[`NamespaceSignature`](NamespaceSignature.md)

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getNamespaces()

> **getNamespaces**(): [`ArkNamespace`](ArkNamespace.md)[]

Defined in: src/core/model/ArkFile.ts:182

#### Returns

[`ArkNamespace`](ArkNamespace.md)[]

***

### getNamespaceWithName()

> **getNamespaceWithName**(`namespaceName`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/model/ArkFile.ts:178

#### Parameters

##### namespaceName

`string`

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getOhPackageJson5Path()

> **getOhPackageJson5Path**(): `string`[]

Defined in: src/core/model/ArkFile.ts:328

#### Returns

`string`[]

***

### getProjectDir()

> **getProjectDir**(): `string`

Defined in: src/core/model/ArkFile.ts:127

#### Returns

`string`

***

### getProjectName()

> **getProjectName**(): `string`

Defined in: src/core/model/ArkFile.ts:316

#### Returns

`string`

***

### getScene()

> **getScene**(): [`Scene`](Scene.md)

Defined in: src/core/model/ArkFile.ts:111

Returns the scene (i.e., [Scene](Scene.md)) built for the project. The [Scene](Scene.md) is the core class of ArkAnalyzer,
through which users can access all the information of the analyzed code (project),
including file list, class list, method list, property list, etc.

#### Returns

[`Scene`](Scene.md)

The scene of the file.

***

### removeArkClass()

> **removeArkClass**(`arkClass`): `boolean`

Defined in: src/core/model/ArkFile.ts:235

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`boolean`

***

### removeExportInfo()

> **removeExportInfo**(`exportInfo`, `key?`): `void`

Defined in: src/core/model/ArkFile.ts:308

#### Parameters

##### exportInfo

[`ExportInfo`](ExportInfo.md)

##### key?

`string`

#### Returns

`void`

***

### removeImportInfo()

> **removeImportInfo**(`importInfo`): `boolean`

Defined in: src/core/model/ArkFile.ts:225

#### Parameters

##### importInfo

[`ImportInfo`](ImportInfo.md)

#### Returns

`boolean`

***

### removeNamespace()

> **removeNamespace**(`namespace`): `boolean`

Defined in: src/core/model/ArkFile.ts:229

#### Parameters

##### namespace

[`ArkNamespace`](ArkNamespace.md)

#### Returns

`boolean`

***

### setCode()

> **setCode**(`code`): `void`

Defined in: src/core/model/ArkFile.ts:149

#### Parameters

##### code

`string`

#### Returns

`void`

***

### setDefaultClass()

> **setDefaultClass**(`defaultClass`): `void`

Defined in: src/core/model/ArkFile.ts:169

#### Parameters

##### defaultClass

[`ArkClass`](ArkClass.md)

#### Returns

`void`

***

### setFilePath()

> **setFilePath**(`absoluteFilePath`): `void`

Defined in: src/core/model/ArkFile.ts:145

#### Parameters

##### absoluteFilePath

`string`

#### Returns

`void`

***

### setFileSignature()

> **setFileSignature**(`fileSignature`): `void`

Defined in: src/core/model/ArkFile.ts:340

#### Parameters

##### fileSignature

[`FileSignature`](FileSignature.md)

#### Returns

`void`

***

### setLanguage()

> **setLanguage**(`language`): `void`

Defined in: src/core/model/ArkFile.ts:89

#### Parameters

##### language

`Language`

#### Returns

`void`

***

### setModuleScene()

> **setModuleScene**(`moduleScene`): `void`

Defined in: src/core/model/ArkFile.ts:119

#### Parameters

##### moduleScene

`ModuleScene`

#### Returns

`void`

***

### setOhPackageJson5Path()

> **setOhPackageJson5Path**(`ohPackageJson5Path`): `void`

Defined in: src/core/model/ArkFile.ts:324

#### Parameters

##### ohPackageJson5Path

`string`[]

#### Returns

`void`

***

### setProjectDir()

> **setProjectDir**(`projectDir`): `void`

Defined in: src/core/model/ArkFile.ts:123

#### Parameters

##### projectDir

`string`

#### Returns

`void`

***

### setScene()

> **setScene**(`scene`): `void`

Defined in: src/core/model/ArkFile.ts:101

#### Parameters

##### scene

[`Scene`](Scene.md)

#### Returns

`void`
