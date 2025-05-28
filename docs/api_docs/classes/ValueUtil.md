[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / ValueUtil

# Class: ValueUtil

Defined in: src/core/common/ValueUtil.ts:20

## Constructors

### Constructor

> **new ValueUtil**(): `ValueUtil`

#### Returns

`ValueUtil`

## Properties

### EMPTY\_STRING\_CONSTANT

> `readonly` `static` **EMPTY\_STRING\_CONSTANT**: `StringConstant`

Defined in: src/core/common/ValueUtil.ts:22

## Methods

### createBigIntConst()

> `static` **createBigIntConst**(`bigInt`): `BigIntConstant`

Defined in: src/core/common/ValueUtil.ts:33

#### Parameters

##### bigInt

`bigint`

#### Returns

`BigIntConstant`

***

### createConst()

> `static` **createConst**(`str`): [`Constant`](Constant.md)

Defined in: src/core/common/ValueUtil.ts:44

#### Parameters

##### str

`string`

#### Returns

[`Constant`](Constant.md)

***

### createStringConst()

> `static` **createStringConst**(`str`): [`Constant`](Constant.md)

Defined in: src/core/common/ValueUtil.ts:37

#### Parameters

##### str

`string`

#### Returns

[`Constant`](Constant.md)

***

### getBooleanConstant()

> `static` **getBooleanConstant**(`value`): [`Constant`](Constant.md)

Defined in: src/core/common/ValueUtil.ts:60

#### Parameters

##### value

`boolean`

#### Returns

[`Constant`](Constant.md)

***

### getNullConstant()

> `static` **getNullConstant**(): [`Constant`](Constant.md)

Defined in: src/core/common/ValueUtil.ts:56

#### Returns

[`Constant`](Constant.md)

***

### getOrCreateNumberConst()

> `static` **getOrCreateNumberConst**(`n`): [`Constant`](Constant.md)

Defined in: src/core/common/ValueUtil.ts:24

#### Parameters

##### n

`number`

#### Returns

[`Constant`](Constant.md)

***

### getUndefinedConst()

> `static` **getUndefinedConst**(): [`Constant`](Constant.md)

Defined in: src/core/common/ValueUtil.ts:52

#### Returns

[`Constant`](Constant.md)
