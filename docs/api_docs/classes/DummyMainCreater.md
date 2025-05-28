[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / DummyMainCreater

# Class: DummyMainCreater

Defined in: src/core/common/DummyMainCreater.ts:59

收集所有的onCreate，onStart等函数，构造一个虚拟函数，具体为：
%statInit()
...
count = 0
while (true) {
    if (count === 1) {
        temp1 = new ability
        temp2 = new want
        temp1.onCreate(temp2)
    }
    if (count === 2) {
        onDestroy()
    }
    ...
    if (count === *) {
        callbackMethod1()
    }
    ...
}
return
如果是instanceInvoke还要先实例化对象，如果是其他文件的类或者方法还要添加import信息

## Constructors

### Constructor

> **new DummyMainCreater**(`scene`): `DummyMainCreater`

Defined in: src/core/common/DummyMainCreater.ts:66

#### Parameters

##### scene

[`Scene`](Scene.md)

#### Returns

`DummyMainCreater`

## Methods

### createDummyMain()

> **createDummyMain**(): `void`

Defined in: src/core/common/DummyMainCreater.ts:79

#### Returns

`void`

***

### getCallbackMethods()

> **getCallbackMethods**(): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/core/common/DummyMainCreater.ts:322

#### Returns

[`ArkMethod`](ArkMethod.md)[]

***

### getDummyMain()

> **getDummyMain**(): [`ArkMethod`](ArkMethod.md)

Defined in: src/core/common/DummyMainCreater.ts:272

#### Returns

[`ArkMethod`](ArkMethod.md)

***

### getMethodsFromAllAbilities()

> **getMethodsFromAllAbilities**(): [`ArkMethod`](ArkMethod.md)[]

Defined in: src/core/common/DummyMainCreater.ts:311

#### Returns

[`ArkMethod`](ArkMethod.md)[]

***

### setEntryMethods()

> **setEntryMethods**(`methods`): `void`

Defined in: src/core/common/DummyMainCreater.ts:75

#### Parameters

##### methods

[`ArkMethod`](ArkMethod.md)[]

#### Returns

`void`
