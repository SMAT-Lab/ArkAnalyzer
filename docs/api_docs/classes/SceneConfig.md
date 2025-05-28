[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / SceneConfig

# Class: SceneConfig

Defined in: src/Config.ts:54

## Constructors

### Constructor

> **new SceneConfig**(`options?`): `SceneConfig`

Defined in: src/Config.ts:69

#### Parameters

##### options?

`SceneOptions`

#### Returns

`SceneConfig`

## Methods

### buildConfig()

> **buildConfig**(`targetProjectName`, `targetProjectDirectory`, `sdks`, `fullFilePath?`): `void`

Defined in: src/Config.ts:86

Set the scene's config,
such as  the target project's name, the used sdks and the full path.

#### Parameters

##### targetProjectName

`string`

the target project's name.

##### targetProjectDirectory

`string`

the target project's directory.

##### sdks

`Sdk`[]

sdks used in this scene.

##### fullFilePath?

`string`[]

the full file path.

#### Returns

`void`

***

### buildFromJson()

> **buildFromJson**(`configJsonPath`): `void`

Defined in: src/Config.ts:171

#### Parameters

##### configJsonPath

`string`

#### Returns

`void`

***

### buildFromProjectDir()

> **buildFromProjectDir**(`targetProjectDirectory`): `void`

Defined in: src/Config.ts:109

Create a sceneConfig object for a specified project path and set the target project directory to the
targetProjectDirectory property of the sceneConfig object.

#### Parameters

##### targetProjectDirectory

`string`

the target project directory, such as xxx/xxx/xxx, started from project
    directory.

#### Returns

`void`

#### Example

1. build a sceneConfig object.
```typescript
const projectDir = 'xxx/xxx/xxx';
const sceneConfig: SceneConfig = new SceneConfig();
sceneConfig.buildFromProjectDir(projectDir);
```

***

### buildFromProjectFiles()

> **buildFromProjectFiles**(`projectName`, `projectDir`, `filesAndDirectorys`, `sdks?`, `languageTags?`): `void`

Defined in: src/Config.ts:115

#### Parameters

##### projectName

`string`

##### projectDir

`string`

##### filesAndDirectorys

`string`[]

##### sdks?

`Sdk`[]

##### languageTags?

`Map`\<`string`, `Language`\>

#### Returns

`void`

***

### getEtsSdkPath()

> **getEtsSdkPath**(): `string`

Defined in: src/Config.ts:228

#### Returns

`string`

***

### getFileLanguages()

> **getFileLanguages**(): `Map`\<`string`, `Language`\>

Defined in: src/Config.ts:216

#### Returns

`Map`\<`string`, `Language`\>

***

### getOptions()

> **getOptions**(): `SceneOptions`

Defined in: src/Config.ts:74

#### Returns

`SceneOptions`

***

### getProjectFiles()

> **getProjectFiles**(): `string`[]

Defined in: src/Config.ts:212

#### Returns

`string`[]

***

### getSdkFiles()

> **getSdkFiles**(): `string`[]

Defined in: src/Config.ts:220

#### Returns

`string`[]

***

### getSdkFilesMap()

> **getSdkFilesMap**(): `Map`\<`string`[], `string`\>

Defined in: src/Config.ts:224

#### Returns

`Map`\<`string`[], `string`\>

***

### getSdksObj()

> **getSdksObj**(): `Sdk`[]

Defined in: src/Config.ts:232

#### Returns

`Sdk`[]

***

### getTargetProjectDirectory()

> **getTargetProjectDirectory**(): `string`

Defined in: src/Config.ts:208

#### Returns

`string`

***

### getTargetProjectName()

> **getTargetProjectName**(): `string`

Defined in: src/Config.ts:204

#### Returns

`string`
