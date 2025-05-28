[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ScriptElementKind

# Enumeration: ScriptElementKind

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7140

## Enumeration Members

### alias

> **alias**: `"alias"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7204

***

### callSignatureElement

> **callSignatureElement**: `"call"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7194

interface Y { ():number; }

***

### classElement

> **classElement**: `"class"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7150

class X {}

***

### constElement

> **constElement**: `"const"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7205

***

### constructorImplementationElement

> **constructorImplementationElement**: `"constructor"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7192

class X { constructor() { } }
class X { static { } }

***

### constructSignatureElement

> **constructSignatureElement**: `"construct"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7198

interface Y { new():Y; }

***

### directory

> **directory**: `"directory"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7207

***

### enumElement

> **enumElement**: `"enum"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7160

enum E

***

### enumMemberElement

> **enumMemberElement**: `"enum member"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7161

***

### externalModuleName

> **externalModuleName**: `"external module name"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7208

***

### functionElement

> **functionElement**: `"function"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7173

Inside module and script only
function f() { }

***

### indexSignatureElement

> **indexSignatureElement**: `"index"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7196

interface Y { []:number; }

***

### interfaceElement

> **interfaceElement**: `"interface"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7156

interface Y {}

***

### ~~jsxAttribute~~

> **jsxAttribute**: `"JSX attribute"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7213

<JsxTagName attribute1 attribute2={0} />

#### Deprecated

***

### keyword

> **keyword**: `"keyword"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7144

predefined type (void) or keyword (class)

***

### label

> **label**: `"label"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7203

***

### letElement

> **letElement**: `"let"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7206

***

### link

> **link**: `"link"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7217

Jsdoc @link: in `{@link C link text}`, the before and after text "" and ""

***

### linkName

> **linkName**: `"link name"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7219

Jsdoc @link: in `{@link C link text}`, the entity name "C"

***

### linkText

> **linkText**: `"link text"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7221

Jsdoc @link: in `{@link C link text}`, the link text "link text"

***

### localClassElement

> **localClassElement**: `"local class"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7152

var x = class X {}

***

### localFunctionElement

> **localFunctionElement**: `"local function"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7175

Inside function

***

### localVariableElement

> **localVariableElement**: `"local var"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7168

Inside function

***

### memberAccessorVariableElement

> **memberAccessorVariableElement**: `"accessor"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7187

class X { [public|private]* accessor foo: number; }

***

### memberFunctionElement

> **memberFunctionElement**: `"method"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7177

class X { [public|private]* foo() {} }

***

### memberGetAccessorElement

> **memberGetAccessorElement**: `"getter"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7179

class X { [public|private]* [get|set] foo:number; }

***

### memberSetAccessorElement

> **memberSetAccessorElement**: `"setter"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7180

***

### memberVariableElement

> **memberVariableElement**: `"property"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7185

class X { [public|private]* foo:number; }
interface Y { foo:number; }

***

### moduleElement

> **moduleElement**: `"module"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7148

module foo {}

***

### parameterElement

> **parameterElement**: `"parameter"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7200

function foo(*Y*: string)

***

### primitiveType

> **primitiveType**: `"primitive type"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7202

***

### scriptElement

> **scriptElement**: `"script"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7146

top level script node

***

### string

> **string**: `"string"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7215

String literal

***

### structElement

> **structElement**: `"struct"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7154

struct X {}

***

### typeElement

> **typeElement**: `"type"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7158

type T = ...

***

### typeParameterElement

> **typeParameterElement**: `"type parameter"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7201

***

### unknown

> **unknown**: `""`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7141

***

### variableElement

> **variableElement**: `"var"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7166

Inside module and script only
const v = ..

***

### warning

> **warning**: `"warning"`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7142
