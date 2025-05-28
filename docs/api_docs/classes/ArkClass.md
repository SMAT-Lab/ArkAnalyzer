[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ArkClass

# Class: ArkClass

Defined in: src/core/model/ArkClass.ts:43

## Extends

- `ArkBaseModel`

## Implements

- `ArkExport`

## Constructors

### Constructor

> **new ArkClass**(): `ArkClass`

Defined in: src/core/model/ArkClass.ts:77

#### Returns

`ArkClass`

#### Overrides

`ArkBaseModel.constructor`

## Properties

### decorators?

> `protected` `optional` **decorators**: `Set`\<[`Decorator`](Decorator.md)\>

Defined in: src/core/model/ArkBaseModel.ts:115

#### Inherited from

`ArkBaseModel.decorators`

***

### metadata?

> `protected` `optional` **metadata**: `ArkMetadata`

Defined in: src/core/model/ArkBaseModel.ts:116

#### Inherited from

`ArkBaseModel.metadata`

***

### modifiers?

> `protected` `optional` **modifiers**: `number`

Defined in: src/core/model/ArkBaseModel.ts:114

#### Inherited from

`ArkBaseModel.modifiers`

## Methods

### addDecorator()

> **addDecorator**(`decorator`): `void`

Defined in: src/core/model/ArkBaseModel.ts:215

#### Parameters

##### decorator

[`Decorator`](Decorator.md)

#### Returns

`void`

#### Inherited from

`ArkBaseModel.addDecorator`

***

### addExtendedClass()

> **addExtendedClass**(`extendedClass`): `void`

Defined in: src/core/model/ArkClass.ts:248

#### Parameters

##### extendedClass

`ArkClass`

#### Returns

`void`

***

### addField()

> **addField**(`field`): `void`

Defined in: src/core/model/ArkClass.ts:304

#### Parameters

##### field

[`ArkField`](ArkField.md)

#### Returns

`void`

***

### addFields()

> **addFields**(`fields`): `void`

Defined in: src/core/model/ArkClass.ts:312

#### Parameters

##### fields

[`ArkField`](ArkField.md)[]

#### Returns

`void`

***

### addGenericType()

> **addGenericType**(`gType`): `void`

Defined in: src/core/model/ArkClass.ts:326

#### Parameters

##### gType

[`GenericType`](GenericType.md)

#### Returns

`void`

***

### addHeritageClassName()

> **addHeritageClassName**(`className`): `void`

Defined in: src/core/model/ArkClass.ts:195

#### Parameters

##### className

`string`

#### Returns

`void`

***

### addMethod()

> **addMethod**(`method`, `originName?`): `void`

Defined in: src/core/model/ArkClass.ts:389

add a method in class.
when a nested method with declare name, add both the declare origin name and signature name
%${declare name}$${outer method name} in class.

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

##### originName?

`string`

#### Returns

`void`

***

### addModifier()

> **addModifier**(`modifier`): `void`

Defined in: src/core/model/ArkBaseModel.ts:142

#### Parameters

##### modifier

`number`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.addModifier`

***

### containsModifier()

> **containsModifier**(`modifierType`): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:194

#### Parameters

##### modifierType

`ModifierType`

#### Returns

`boolean`

#### Implementation of

`ArkExport.containsModifier`

#### Inherited from

`ArkBaseModel.containsModifier`

***

### getAllHeritageClasses()

> **getAllHeritageClasses**(): `ArkClass`[]

Defined in: src/core/model/ArkClass.ts:233

#### Returns

`ArkClass`[]

***

### getAnonymousMethodNumber()

> **getAnonymousMethodNumber**(): `number`

Defined in: src/core/model/ArkClass.ts:484

#### Returns

`number`

***

### getCategory()

> **getCategory**(): `ClassCategory`

Defined in: src/core/model/ArkClass.ts:132

#### Returns

`ClassCategory`

***

### getCode()

> **getCode**(): `undefined` \| `string`

Defined in: src/core/model/ArkClass.ts:100

Returns the codes of class as a **string.**

#### Returns

`undefined` \| `string`

the codes of class.

***

### getColumn()

> **getColumn**(): `number`

Defined in: src/core/model/ArkClass.ts:124

Returns the column position of this class.

#### Returns

`number`

The column position of this class.

***

### getDeclaringArkFile()

> **getDeclaringArkFile**(): [`ArkFile`](ArkFile.md)

Defined in: src/core/model/ArkClass.ts:150

Returns the declaring file.

#### Returns

[`ArkFile`](ArkFile.md)

A file defined by ArkAnalyzer.

#### Example

1. Get the [ArkFile](ArkFile.md) which the ArkClass is in.

```typescript
const arkFile = arkClass.getDeclaringArkFile();
```

***

### getDeclaringArkNamespace()

> **getDeclaringArkNamespace**(): `undefined` \| [`ArkNamespace`](ArkNamespace.md)

Defined in: src/core/model/ArkClass.ts:162

Returns the declaring namespace of this class, which may also be an **undefined**.

#### Returns

`undefined` \| [`ArkNamespace`](ArkNamespace.md)

The declaring namespace (may be **undefined**) of this class.

***

### getDecorators()

> **getDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:202

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getDecorators`

***

### getDefaultArkMethod()

> **getDefaultArkMethod**(): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/model/ArkClass.ts:410

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getExportType()

> **getExportType**(): `ExportType`

Defined in: src/core/model/ArkClass.ts:492

#### Returns

`ExportType`

#### Implementation of

`ArkExport.getExportType`

***

### getExtendedClasses()

> **getExtendedClasses**(): `Map`\<`string`, `ArkClass`\>

Defined in: src/core/model/ArkClass.ts:244

#### Returns

`Map`\<`string`, `ArkClass`\>

***

### getField()

> **getField**(`fieldSignature`): `null` \| [`ArkField`](ArkField.md)

Defined in: src/core/model/ArkClass.ts:277

Get the field according to its field signature.
If no field cound be found, **null**will be returned.

#### Parameters

##### fieldSignature

[`FieldSignature`](FieldSignature.md)

the field's signature.

#### Returns

`null` \| [`ArkField`](ArkField.md)

A field. If there is no field in this class, the return will be a **null**.

***

### getFields()

> **getFields**(): [`ArkField`](ArkField.md)[]

Defined in: src/core/model/ArkClass.ts:298

Returns an **array** of fields in the class.

#### Returns

[`ArkField`](ArkField.md)[]

an **array** of fields in the class.

***

### getFieldWithName()

> **getFieldWithName**(`fieldName`): `null` \| [`ArkField`](ArkField.md)

Defined in: src/core/model/ArkClass.ts:286

#### Parameters

##### fieldName

`string`

#### Returns

`null` \| [`ArkField`](ArkField.md)

***

### getGenericsTypes()

> **getGenericsTypes**(): `undefined` \| [`GenericType`](GenericType.md)[]

Defined in: src/core/model/ArkClass.ts:322

#### Returns

`undefined` \| [`GenericType`](GenericType.md)[]

***

### getGlobalVariable()

> **getGlobalVariable**(`globalMap`): [`Local`](Local.md)[]

Defined in: src/core/model/ArkClass.ts:477

#### Parameters

##### globalMap

`Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), [`Local`](Local.md)[]\>

#### Returns

[`Local`](Local.md)[]

***

### getImplementedInterface()

> **getImplementedInterface**(`interfaceName`): `null` \| `ArkClass`

Defined in: src/core/model/ArkClass.ts:263

#### Parameters

##### interfaceName

`string`

#### Returns

`null` \| `ArkClass`

***

### getImplementedInterfaceNames()

> **getImplementedInterfaceNames**(): `string`[]

Defined in: src/core/model/ArkClass.ts:252

#### Returns

`string`[]

***

### getIndexSignatureNumber()

> **getIndexSignatureNumber**(): `number`

Defined in: src/core/model/ArkClass.ts:488

#### Returns

`number`

***

### getInstanceInitMethod()

> **getInstanceInitMethod**(): [`ArkMethod`](ArkMethod.md)

Defined in: src/core/model/ArkClass.ts:496

#### Returns

[`ArkMethod`](ArkMethod.md)

***

### getLanguage()

> **getLanguage**(): `Language`

Defined in: src/core/model/ArkClass.ts:84

Returns the program language of the file where this class defined.

#### Returns

`Language`

***

### getLine()

> **getLine**(): `number`

Defined in: src/core/model/ArkClass.ts:112

Returns the line position of this class.

#### Returns

`number`

The line position of this class.

***

### getMetadata()

> **getMetadata**(`kind`): `undefined` \| `ArkMetadataType`

Defined in: src/core/model/ArkBaseModel.ts:118

#### Parameters

##### kind

`ArkMetadataKind`

#### Returns

`undefined` \| `ArkMetadataType`

#### Inherited from

`ArkBaseModel.getMetadata`

***

### getMethod()

> **getMethod**(`methodSignature`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/model/ArkClass.ts:355

#### Parameters

##### methodSignature

[`MethodSignature`](MethodSignature.md)

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getMethods()

> **getMethods**(`generated?`): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/core/model/ArkClass.ts:349

Returns all methods defined in the specific class in the form of an array.

#### Parameters

##### generated?

`boolean`

indicating whether this API returns the methods that are dynamically
generated at runtime. If it is not specified as true or false, the return will not include the generated method.

#### Returns

[`ArkMethod`](ArkMethod.md)[]

An array of all methods in this class.

#### Example

1. Get methods defined in class `BookService`.

```typescript
let classes: ArkClass[] = scene.getClasses();
let serviceClass : ArkClass = classes[1];
let methods: ArkMethod[] = serviceClass.getMethods();
let methodNames: string[] = methods.map(mthd => mthd.name);
console.log(methodNames);
```

***

### getMethodWithName()

> **getMethodWithName**(`methodName`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/model/ArkClass.ts:376

#### Parameters

##### methodName

`string`

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getModifiers()

> **getModifiers**(): `number`

Defined in: src/core/model/ArkBaseModel.ts:129

#### Returns

`number`

#### Implementation of

`ArkExport.getModifiers`

#### Inherited from

`ArkBaseModel.getModifiers`

***

### getName()

> **getName**(): `string`

Defined in: src/core/model/ArkClass.ts:92

Returns the **string**name of this class.

#### Returns

`string`

The name of this class.

#### Implementation of

`ArkExport.getName`

***

### getRealTypes()

> **getRealTypes**(): `undefined` \| [`Type`](Type.md)[]

Defined in: src/core/model/ArkClass.ts:318

#### Returns

`undefined` \| [`Type`](Type.md)[]

***

### getSignature()

> **getSignature**(): [`ClassSignature`](ClassSignature.md)

Defined in: src/core/model/ArkClass.ts:183

Returns the signature of current class (i.e., [ClassSignature](ClassSignature.md)).
The [ClassSignature](ClassSignature.md) can uniquely identify a class, according to which we can find the class from the scene.

#### Returns

[`ClassSignature`](ClassSignature.md)

The class signature.

#### Implementation of

`ArkExport.getSignature`

***

### getStateDecorators()

> **getStateDecorators**(): [`Decorator`](Decorator.md)[]

Defined in: src/core/model/ArkBaseModel.ts:234

#### Returns

[`Decorator`](Decorator.md)[]

#### Inherited from

`ArkBaseModel.getStateDecorators`

***

### getStaticFields()

> **getStaticFields**(`classMap`): [`ArkField`](ArkField.md)[]

Defined in: src/core/model/ArkClass.ts:459

#### Parameters

##### classMap

`Map`\<[`NamespaceSignature`](NamespaceSignature.md) \| [`FileSignature`](FileSignature.md), `ArkClass`[]\>

#### Returns

[`ArkField`](ArkField.md)[]

***

### getStaticFieldWithName()

> **getStaticFieldWithName**(`fieldName`): `null` \| [`ArkField`](ArkField.md)

Defined in: src/core/model/ArkClass.ts:290

#### Parameters

##### fieldName

`string`

#### Returns

`null` \| [`ArkField`](ArkField.md)

***

### getStaticInitMethod()

> **getStaticInitMethod**(): [`ArkMethod`](ArkMethod.md)

Defined in: src/core/model/ArkClass.ts:500

#### Returns

[`ArkMethod`](ArkMethod.md)

***

### getStaticMethodWithName()

> **getStaticMethodWithName**(`methodName`): `null` \| [`ArkMethod`](ArkMethod.md)

Defined in: src/core/model/ArkClass.ts:380

#### Parameters

##### methodName

`string`

#### Returns

`null` \| [`ArkMethod`](ArkMethod.md)

***

### getSuperClass()

> **getSuperClass**(): `null` \| `ArkClass`

Defined in: src/core/model/ArkClass.ts:203

Returns the superclass of this class.

#### Returns

`null` \| `ArkClass`

The superclass of this class.

***

### getSuperClassName()

> **getSuperClassName**(): `string`

Defined in: src/core/model/ArkClass.ts:191

#### Returns

`string`

***

### getViewTree()

> **getViewTree**(): `undefined` \| [`ViewTree`](../interfaces/ViewTree.md)

Defined in: src/core/model/ArkClass.ts:434

Returns the view tree of the ArkClass.

#### Returns

`undefined` \| [`ViewTree`](../interfaces/ViewTree.md)

The view tree of the ArkClass.

#### Example

1. get viewTree of ArkClass.

```typescript
for (let arkFiles of scene.getFiles()) {
for (let arkClasss of arkFiles.getClasses()) {
if (arkClasss.hasViewTree()) {
arkClasss.getViewTree();
}
}
}
```

***

### hasBuilderDecorator()

> **hasBuilderDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:230

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasBuilderDecorator`

***

### hasBuilderParamDecorator()

> **hasBuilderParamDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:243

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasBuilderParamDecorator`

***

### hasComponentDecorator()

> **hasComponentDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:251

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasComponentDecorator`

***

### hasDecorator()

> **hasDecorator**(`kind`): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:255

#### Parameters

##### kind

`string` | `Set`\<`string`\>

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasDecorator`

***

### hasEntryDecorator()

> **hasEntryDecorator**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:247

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.hasEntryDecorator`

***

### hasImplementedInterface()

> **hasImplementedInterface**(`interfaceName`): `boolean`

Defined in: src/core/model/ArkClass.ts:259

#### Parameters

##### interfaceName

`string`

#### Returns

`boolean`

***

### hasViewTree()

> **hasViewTree**(): `boolean`

Defined in: src/core/model/ArkClass.ts:455

Check whether the view tree is defined.
If it is defined, the return value is true, otherwise it is false.

#### Returns

`boolean`

True if the view tree is defined; false otherwise.

#### Example

1. Judge viewTree of ArkClass.

```typescript
for (let arkFiles of scene.getFiles()) {
for (let arkClasss of arkFiles.getClasses()) {
if (arkClasss.hasViewTree()) {
arkClasss.getViewTree();
}
}
}
```

***

### isAbstract()

> **isAbstract**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:173

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isAbstract`

***

### isAnonymousClass()

> **isAnonymousClass**(): `boolean`

Defined in: src/core/model/ArkClass.ts:174

#### Returns

`boolean`

***

### isDeclare()

> **isDeclare**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:190

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isDeclare`

***

### isDefault()

> **isDefault**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:181

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isDefault`

***

### isDefaultArkClass()

> **isDefaultArkClass**(): `boolean`

Defined in: src/core/model/ArkClass.ts:170

#### Returns

`boolean`

***

### isExport()

> **isExport**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:177

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isExport`

***

### ~~isExported()~~

> **isExported**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:186

#### Returns

`boolean`

#### Deprecated

Use [isExport](ArkNamespace.md#isexport) instead.

#### Inherited from

`ArkBaseModel.isExported`

***

### isPrivate()

> **isPrivate**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:161

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isPrivate`

***

### isProtected()

> **isProtected**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:157

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isProtected`

***

### isPublic()

> **isPublic**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:165

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isPublic`

***

### isReadonly()

> **isReadonly**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:169

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isReadonly`

***

### isStatic()

> **isStatic**(): `boolean`

Defined in: src/core/model/ArkBaseModel.ts:153

#### Returns

`boolean`

#### Inherited from

`ArkBaseModel.isStatic`

***

### removeDecorator()

> **removeDecorator**(`kind`): `void`

Defined in: src/core/model/ArkBaseModel.ts:222

#### Parameters

##### kind

`string`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.removeDecorator`

***

### removeField()

> **removeField**(`field`): `boolean`

Defined in: src/core/model/ArkClass.ts:512

#### Parameters

##### field

[`ArkField`](ArkField.md)

#### Returns

`boolean`

***

### removeMethod()

> **removeMethod**(`method`): `boolean`

Defined in: src/core/model/ArkClass.ts:519

#### Parameters

##### method

[`ArkMethod`](ArkMethod.md)

#### Returns

`boolean`

***

### removeModifier()

> **removeModifier**(`modifier`): `void`

Defined in: src/core/model/ArkBaseModel.ts:146

#### Parameters

##### modifier

`ModifierType`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.removeModifier`

***

### setCategory()

> **setCategory**(`category`): `void`

Defined in: src/core/model/ArkClass.ts:136

#### Parameters

##### category

`ClassCategory`

#### Returns

`void`

***

### setCode()

> **setCode**(`code`): `void`

Defined in: src/core/model/ArkClass.ts:104

#### Parameters

##### code

`string`

#### Returns

`void`

***

### setColumn()

> **setColumn**(`column`): `void`

Defined in: src/core/model/ArkClass.ts:128

#### Parameters

##### column

`number`

#### Returns

`void`

***

### setDeclaringArkFile()

> **setDeclaringArkFile**(`declaringArkFile`): `void`

Defined in: src/core/model/ArkClass.ts:154

#### Parameters

##### declaringArkFile

[`ArkFile`](ArkFile.md)

#### Returns

`void`

***

### setDeclaringArkNamespace()

> **setDeclaringArkNamespace**(`declaringArkNamespace`): `void`

Defined in: src/core/model/ArkClass.ts:166

#### Parameters

##### declaringArkNamespace

`undefined` | [`ArkNamespace`](ArkNamespace.md)

#### Returns

`void`

***

### setDecorators()

> **setDecorators**(`decorators`): `void`

Defined in: src/core/model/ArkBaseModel.ts:209

#### Parameters

##### decorators

`Set`\<[`Decorator`](Decorator.md)\>

#### Returns

`void`

#### Inherited from

`ArkBaseModel.setDecorators`

***

### setDefaultArkMethod()

> **setDefaultArkMethod**(`defaultMethod`): `void`

Defined in: src/core/model/ArkClass.ts:405

#### Parameters

##### defaultMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### setInstanceInitMethod()

> **setInstanceInitMethod**(`arkMethod`): `void`

Defined in: src/core/model/ArkClass.ts:504

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### setLine()

> **setLine**(`line`): `void`

Defined in: src/core/model/ArkClass.ts:116

#### Parameters

##### line

`number`

#### Returns

`void`

***

### setMetadata()

> **setMetadata**(`kind`, `value`): `void`

Defined in: src/core/model/ArkBaseModel.ts:122

#### Parameters

##### kind

`ArkMetadataKind`

##### value

`ArkMetadataType`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.setMetadata`

***

### setModifiers()

> **setModifiers**(`modifiers`): `void`

Defined in: src/core/model/ArkBaseModel.ts:136

#### Parameters

##### modifiers

`number`

#### Returns

`void`

#### Inherited from

`ArkBaseModel.setModifiers`

***

### setSignature()

> **setSignature**(`classSig`): `void`

Defined in: src/core/model/ArkClass.ts:187

#### Parameters

##### classSig

[`ClassSignature`](ClassSignature.md)

#### Returns

`void`

***

### setStaticInitMethod()

> **setStaticInitMethod**(`arkMethod`): `void`

Defined in: src/core/model/ArkClass.ts:508

#### Parameters

##### arkMethod

[`ArkMethod`](ArkMethod.md)

#### Returns

`void`

***

### setViewTree()

> **setViewTree**(`viewTree`): `void`

Defined in: src/core/model/ArkClass.ts:414

#### Parameters

##### viewTree

[`ViewTree`](../interfaces/ViewTree.md)

#### Returns

`void`

***

### validate()

> **validate**(): `ArkError`

Defined in: src/core/model/ArkClass.ts:530

#### Returns

`ArkError`

#### Overrides

`ArkBaseModel.validate`

***

### validateFields()

> `protected` **validateFields**(`fields`): `ArkError`

Defined in: src/core/model/ArkBaseModel.ts:267

#### Parameters

##### fields

`string`[]

#### Returns

`ArkError`

#### Inherited from

`ArkBaseModel.validateFields`
