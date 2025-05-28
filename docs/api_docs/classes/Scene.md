[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Scene

# Class: Scene

Defined in: src/Scene.ts:61

The Scene class includes everything in the analyzed project.
We should be able to re-generate the project's code based on this class.

## Constructors

### Constructor

> **new Scene**(): `Scene`

Defined in: src/Scene.ts:100

#### Returns

`Scene`

## Methods

### addToMethodsMap()

> **addToMethodsMap**(`method`): `void`

Defined in: src/Scene.ts:953

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### buildBasicInfo()

> **buildBasicInfo**(`sceneConfig`): `void`

Defined in: src/Scene.ts:174

Set the basic information of the scene using a config,
such as the project's name, real path and files.

#### Parameters

##### sceneConfig

[`SceneConfig`](SceneConfig.md)

the config used to set the basic information of scene.

#### Returns

`void`

***

### buildClassDone()

> **buildClassDone**(): `boolean`

Defined in: src/Scene.ts:1363

#### Returns

`boolean`

***

### buildModuleScene()

> **buildModuleScene**(`moduleName`, `modulePath`, `supportFileExts`): `void`

Defined in: src/Scene.ts:625

#### Parameters

##### moduleName

`string`

##### modulePath

`string`

##### supportFileExts

`string`[]

#### Returns

`void`

***

### buildScene4HarmonyProject()

> **buildScene4HarmonyProject**(): `void`

Defined in: src/Scene.ts:603

Build the scene for harmony project. It resolves the file path of the project first, and then fetches
dependencies from this file. Next, build a `ModuleScene` for this project to generate [ArkFile](ArkFile.md). Finally,
it build bodies of all methods, generate extended classes, and add DefaultConstructors.

#### Returns

`void`

***

### buildSceneFromFiles()

> **buildSceneFromFiles**(`sceneConfig`): `void`

Defined in: src/Scene.ts:162

#### Parameters

##### sceneConfig

[`SceneConfig`](SceneConfig.md)

#### Returns

`void`

***

### buildSceneFromProjectDir()

> **buildSceneFromProjectDir**(`sceneConfig`): `void`

Defined in: src/Scene.ts:157

Build scene object according to the [SceneConfig](SceneConfig.md). This API implements 3 functions.
First is to build scene object from [SceneConfig](SceneConfig.md), second is to generate [ArkFile](ArkFile.md)s,
and the last is to collect project import infomation.

#### Parameters

##### sceneConfig

[`SceneConfig`](SceneConfig.md)

a sceneConfig object, which is usally defined by user or Json file.

#### Returns

`void`

#### Example

1. Build Scene object from scene config

```typescript
// build config
const projectDir = ... ...;
const sceneConfig = new SceneConfig();
sceneConfig.buildFromProjectDir(projectDir);

// build scene
const scene = new Scene();
scene.buildSceneFromProjectDir(sceneConfig);
```

***

### clear()

> **clear**(): `void`

Defined in: src/Scene.ts:114

#### Returns

`void`

***

### getbaseUrl()

> **getbaseUrl**(): `undefined` \| `string`

Defined in: src/Scene.ts:1379

#### Returns

`undefined` \| `string`

***

### getClass()

> **getClass**(`classSignature`): `null` \| [`ArkClass`](ArkClass.md)

Defined in: src/Scene.ts:847

Returns the class according to the input class signature.

#### Parameters

##### classSignature

[`ClassSignature`](ClassSignature.md)

signature of the class to be obtained.

#### Returns

`null` \| [`ArkClass`](ArkClass.md)

A class.

***

### getClasses()

> **getClasses**(): [`ArkClass`](ArkClass.md)[]

Defined in: src/Scene.ts:889

#### Returns

[`ArkClass`](ArkClass.md)[]

***

### getClassMap()

> **getClassMap**(): `Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`ArkClass`](ArkClass.md)[]\>

Defined in: src/Scene.ts:1170

#### Returns

`Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`ArkClass`](ArkClass.md)[]\>

***

### getEntryPoints()

> **getEntryPoints**(): [`MethodSignature`](MethodSignature.md)[]

Defined in: src/Scene.ts:978

#### Returns

[`MethodSignature`](MethodSignature.md)[]

***

### getFile()

> **getFile**(`fileSignature`): `null` \| [`ArkFile`](ArkFile.md)

Defined in: src/Scene.ts:722

Returns the file based on its signature.
If no file can be found according to the input signature, **null** will be returned.
A typical [ArkFile](ArkFile.md) contains: file's name (i.e., its relative path), project's name,
project's dir, file's signature etc.

#### Parameters

##### fileSignature

[`FileSignature`](FileSignature.md)

the signature of file.

#### Returns

`null` \| [`ArkFile`](ArkFile.md)

a file defined by ArkAnalyzer. **null** will be returned if no file could be found.

#### Example

1. get ArkFile based on file signature.

```typescript
if (...) {
const fromSignature = new FileSignature();
fromSignature.setProjectName(im.getDeclaringArkFile().getProjectName());
fromSignature.setFileName(fileName);
return scene.getFile(fromSignature);
}
```

***

### getFileLanguages()

> **getFileLanguages**(): `Map`\<`string`, `Language`\>

Defined in: src/Scene.ts:784

#### Returns

`Map`\<`string`, `Language`\>

***

### getFiles()

> **getFiles**(): [`ArkFile`](ArkFile.md)[]

Defined in: src/Scene.ts:780

Get files of a Scene. Generally, a project includes several ets/ts files that define the different
class. We need to generate [ArkFile](ArkFile.md) objects from these ets/ts files.

#### Returns

[`ArkFile`](ArkFile.md)[]

The array of [ArkFile](ArkFile.md) from `scene.filesMap.values()`.

#### Example

1. In inferSimpleTypes() to check arkClass and arkMethod.
```typescript
public inferSimpleTypes(): void {
  for (let arkFile of this.getFiles()) {
      for (let arkClass of arkFile.getClasses()) {
          for (let arkMethod of arkClass.getMethods()) {
          // ... ...;
          }
      }
  }
}
```
2. To iterate each method
```typescript
for (const file of this.getFiles()) {
    for (const cls of file.getClasses()) {
        for (const method of cls.getMethods()) {
            // ... ...
        }
    }
}
```

***

### getGlobalModule2PathMapping()

> **getGlobalModule2PathMapping**(): `undefined` \| \{[`k`: `string`]: `string`[]; \}

Defined in: src/Scene.ts:1375

#### Returns

`undefined` \| \{[`k`: `string`]: `string`[]; \}

***

### getGlobalVariableMap()

> **getGlobalVariableMap**(): `Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`Local`](Local.md)[]\>

Defined in: src/Scene.ts:1317

#### Returns

`Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`Local`](Local.md)[]\>

***

### getMethod()

> **getMethod**(`methodSignature`, `refresh?`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/Scene.ts:893

#### Parameters

##### methodSignature

[`MethodSignature`](MethodSignature.md)

##### refresh?

`boolean`

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getMethods()

> **getMethods**(): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/Scene.ts:949

Returns the method associated with the method signature.
If no method is associated with this signature, **null** will be returned.
An [ArkMethod](ArkMethod.md) includes:
- Name: the **string** name of method.
- Code: the **string** code of the method.
- Line: a **number** indicating the line location, initialized as -1.
- Column: a **number** indicating the column location, initialized as -1.
- Parameters & Types of parameters: the parameters of method and their types.
- View tree: the view tree of the method.
- ...

#### Returns

[`ArkMethod`](ArkMethod.md)[]

The method associated with the method signature.

#### Example

1. get method from getMethod.

```typescript
const methodSignatures = this.CHA.resolveCall(xxx, yyy);
for (const methodSignature of methodSignatures) {
const method = this.scene.getMethod(methodSignature);
... ...
}
```

***

### getModuleScene()

> **getModuleScene**(`moduleName`): `undefined` \| `ModuleScene`

Defined in: src/Scene.ts:1367

#### Parameters

##### moduleName

`string`

#### Returns

`undefined` \| `ModuleScene`

***

### getModuleSceneMap()

> **getModuleSceneMap**(): `Map`\<`string`, `ModuleScene`\>

Defined in: src/Scene.ts:1371

#### Returns

`Map`\<`string`, `ModuleScene`\>

***

### getModuleSdkMap()

> **getModuleSdkMap**(): `Map`\<`string`, `Sdk`[]\>

Defined in: src/Scene.ts:792

#### Returns

`Map`\<`string`, `Sdk`[]\>

***

### getNamespace()

> **getNamespace**(`namespaceSignature`): `null` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/Scene.ts:800

#### Parameters

##### namespaceSignature

[`NamespaceSignature`](NamespaceSignature.md)

#### Returns

`null` \| [`ArkNamespace`](ArkNamespace.md)

***

### getNamespaces()

> **getNamespaces**(): [`ArkNamespace`](ArkNamespace.md)[]

Defined in: src/Scene.ts:838

#### Returns

[`ArkNamespace`](ArkNamespace.md)[]

***

### getOhPkgContent()

> **getOhPkgContent**(): `object`

Defined in: src/Scene.ts:987

#### Returns

`object`

***

### getOhPkgContentMap()

> **getOhPkgContentMap**(): `Map`\<`string`, \{[`p`: `string`]: `unknown`; \}\>

Defined in: src/Scene.ts:991

#### Returns

`Map`\<`string`, \{[`p`: `string`]: `unknown`; \}\>

***

### getOhPkgFilePath()

> **getOhPkgFilePath**(): `string`

Defined in: src/Scene.ts:995

#### Returns

`string`

***

### getOptions()

> **getOptions**(): `SceneOptions`

Defined in: src/Scene.ts:102

#### Returns

`SceneOptions`

***

### getOverRideDependencyMap()

> **getOverRideDependencyMap**(): `Map`\<`string`, `unknown`\>

Defined in: src/Scene.ts:110

#### Returns

`Map`\<`string`, `unknown`\>

***

### getOverRides()

> **getOverRides**(): `Map`\<`string`, `string`\>

Defined in: src/Scene.ts:106

#### Returns

`Map`\<`string`, `string`\>

***

### getProjectFiles()

> **getProjectFiles**(): `string`[]

Defined in: src/Scene.ts:695

#### Returns

`string`[]

***

### getProjectName()

> **getProjectName**(): `string`

Defined in: src/Scene.ts:691

Returns the **string** name of the project.

#### Returns

`string`

The name of the project.

***

### getProjectSdkMap()

> **getProjectSdkMap**(): `Map`\<`string`, `Sdk`\>

Defined in: src/Scene.ts:796

#### Returns

`Map`\<`string`, `Sdk`\>

***

### getRealProjectDir()

> **getRealProjectDir**(): `string`

Defined in: src/Scene.ts:683

Get the absolute path of current project.

#### Returns

`string`

The real project's directiory.

#### Example

1. get real project directory, such as:
```typescript
let projectDir = projectScene.getRealProjectDir(); 
```

***

### getSdkArkFiles()

> **getSdkArkFiles**(): [`ArkFile`](ArkFile.md)[]

Defined in: src/Scene.ts:788

#### Returns

[`ArkFile`](ArkFile.md)[]

***

### getSdkGlobal()

> **getSdkGlobal**(`globalName`): `null` \| `ArkExport`

Defined in: src/Scene.ts:699

#### Parameters

##### globalName

`string`

#### Returns

`null` \| `ArkExport`

***

### getStage()

> **getStage**(): `SceneBuildStage`

Defined in: src/Scene.ts:134

#### Returns

`SceneBuildStage`

***

### getStaticInitMethods()

> **getStaticInitMethods**(): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/Scene.ts:1353

#### Returns

[`ArkMethod`](ArkMethod.md)[]

***

### getUnhandledFilePaths()

> **getUnhandledFilePaths**(): `string`[]

Defined in: src/Scene.ts:733

#### Returns

`string`[]

***

### getUnhandledSdkFilePaths()

> **getUnhandledSdkFilePaths**(): `string`[]

Defined in: src/Scene.ts:740

#### Returns

`string`[]

***

### getVisibleValue()

> **getVisibleValue**(): [`VisibleValue`](VisibleValue.md)

Defined in: src/Scene.ts:983

get values that is visible in curr scope

#### Returns

[`VisibleValue`](VisibleValue.md)

***

### hasMainMethod()

> **hasMainMethod**(): `boolean`

Defined in: src/Scene.ts:973

#### Returns

`boolean`

***

### hasSdkFile()

> **hasSdkFile**(`fileSignature`): `boolean`

Defined in: src/Scene.ts:748

#### Parameters

##### fileSignature

[`FileSignature`](FileSignature.md)

#### Returns

`boolean`

***

### inferSimpleTypes()

> **inferSimpleTypes**(): `void`

Defined in: src/Scene.ts:1063

Iterate all assignment statements in methods,
and set the type of left operand based on the type of right operand
if the left operand is a local variable as well as an unknown.

#### Returns

`void`

#### Deprecated

#### Example

1. Infer simple type when scene building.

```typescript
let scene = new Scene();
scene.buildSceneFromProjectDir(config);
scene.inferSimpleTypes();
```

***

### inferTypes()

> **inferTypes**(): `void`

Defined in: src/Scene.ts:1025

Infer type for each non-default method. It infers the type of each field/local/reference.
For example, the statement `let b = 5;`, the type of local `b` is `NumberType`; and for the statement `let s =
'hello';`, the type of local `s` is `StringType`. The detailed types are defined in the Type.ts file.

#### Returns

`void`

#### Example

1. Infer the type of each class field and method field.
```typescript
const scene = new Scene();
scene.buildSceneFromProjectDir(sceneConfig);
scene.inferTypes();
```

***

### makeCallGraphCHA()

> **makeCallGraphCHA**(`entryPoints`): [`CallGraph`](CallGraph.md)

Defined in: src/Scene.ts:999

#### Parameters

##### entryPoints

[`MethodSignature`](MethodSignature.md)[]

#### Returns

[`CallGraph`](CallGraph.md)

***

### makeCallGraphRTA()

> **makeCallGraphRTA**(`entryPoints`): [`CallGraph`](CallGraph.md)

Defined in: src/Scene.ts:1006

#### Parameters

##### entryPoints

[`MethodSignature`](MethodSignature.md)[]

#### Returns

[`CallGraph`](CallGraph.md)

***

### removeClass()

> **removeClass**(`arkClass`): `boolean`

Defined in: src/Scene.ts:961

#### Parameters

##### arkClass

[`ArkClass`](ArkClass.md)

#### Returns

`boolean`

***

### removeFile()

> **removeFile**(`file`): `boolean`

Defined in: src/Scene.ts:969

#### Parameters

##### file

[`ArkFile`](ArkFile.md)

#### Returns

`boolean`

***

### removeMethod()

> **removeMethod**(`method`): `boolean`

Defined in: src/Scene.ts:957

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`boolean`

***

### removeNamespace()

> **removeNamespace**(`namespace`): `boolean`

Defined in: src/Scene.ts:965

#### Parameters

##### namespace

[`ArkNamespace`](ArkNamespace.md)

#### Returns

`boolean`

***

### setFile()

> **setFile**(`file`): `void`

Defined in: src/Scene.ts:744

#### Parameters

##### file

[`ArkFile`](ArkFile.md)

#### Returns

`void`
