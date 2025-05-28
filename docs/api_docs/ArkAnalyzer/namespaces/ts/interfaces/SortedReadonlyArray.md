[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SortedReadonlyArray

# Interface: SortedReadonlyArray\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:28

## Extends

- `ReadonlyArray`\<`T`\>

## Type Parameters

### T

`T`

## Indexable

\[`n`: `number`\]: `T`

## Properties

###  \_\_sortedArrayBrand

> ** \_\_sortedArrayBrand**: `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:29

***

### \[unscopables\]

> `readonly` **\[unscopables\]**: `object`

Defined in: node\_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts:107

Is an object whose properties have the value 'true'
when they will be absent when used in a 'with' statement.

#### Index Signature

\[`key`: `number`\]: `undefined` \| `boolean`

#### \[iterator\]?

> `optional` **\[iterator\]**: `boolean`

#### \[unscopables\]?

> `readonly` `optional` **\[unscopables\]**: `boolean`

Is an object whose properties have the value 'true'
when they will be absent when used in a 'with' statement.

#### at?

> `optional` **at**: `boolean`

#### concat?

> `optional` **concat**: `boolean`

#### entries?

> `optional` **entries**: `boolean`

#### every?

> `optional` **every**: `boolean`

#### filter?

> `optional` **filter**: `boolean`

#### find?

> `optional` **find**: `boolean`

#### findIndex?

> `optional` **findIndex**: `boolean`

#### flat?

> `optional` **flat**: `boolean`

#### flatMap?

> `optional` **flatMap**: `boolean`

#### forEach?

> `optional` **forEach**: `boolean`

#### includes?

> `optional` **includes**: `boolean`

#### indexOf?

> `optional` **indexOf**: `boolean`

#### join?

> `optional` **join**: `boolean`

#### keys?

> `optional` **keys**: `boolean`

#### lastIndexOf?

> `optional` **lastIndexOf**: `boolean`

#### length?

> `readonly` `optional` **length**: `boolean`

Gets the length of the array. This is a number one higher than the highest element defined in an array.

#### map?

> `optional` **map**: `boolean`

#### reduce?

> `optional` **reduce**: `boolean`

#### reduceRight?

> `optional` **reduceRight**: `boolean`

#### slice?

> `optional` **slice**: `boolean`

#### some?

> `optional` **some**: `boolean`

#### toLocaleString?

> `optional` **toLocaleString**: `boolean`

#### toString?

> `optional` **toString**: `boolean`

#### values?

> `optional` **values**: `boolean`

#### Inherited from

`ReadonlyArray.[unscopables]`

***

### length

> `readonly` **length**: `number`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1192

Gets the length of the array. This is a number one higher than the highest element defined in an array.

#### Inherited from

`ReadonlyArray.length`

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<`T`\>

Defined in: node\_modules/typescript/lib/lib.es2015.iterable.d.ts:94

Iterator of values in the array.

#### Returns

`IterableIterator`\<`T`\>

#### Inherited from

`ReadonlyArray.[iterator]`

***

### at()

> **at**(`index`): `undefined` \| `T`

Defined in: node\_modules/@types/node/compatibility/indexable.d.ts:7

#### Parameters

##### index

`number`

#### Returns

`undefined` \| `T`

#### Inherited from

`ReadonlyArray.at`

***

### concat()

#### Call Signature

> **concat**(...`items`): `T`[]

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1205

Combines two or more arrays.

##### Parameters

###### items

...`ConcatArray`\<`T`\>[]

Additional items to add to the end of array1.

##### Returns

`T`[]

##### Inherited from

`ReadonlyArray.concat`

#### Call Signature

> **concat**(...`items`): `T`[]

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1210

Combines two or more arrays.

##### Parameters

###### items

...(`T` \| `ConcatArray`\<`T`\>)[]

Additional items to add to the end of array1.

##### Returns

`T`[]

##### Inherited from

`ReadonlyArray.concat`

***

### entries()

> **entries**(): `IterableIterator`\<\[`number`, `T`\]\>

Defined in: node\_modules/typescript/lib/lib.es2015.iterable.d.ts:99

Returns an iterable of key, value pairs for every entry in the array

#### Returns

`IterableIterator`\<\[`number`, `T`\]\>

#### Inherited from

`ReadonlyArray.entries`

***

### every()

#### Call Signature

> **every**\<`S`\>(`predicate`, `thisArg?`): `this is readonly S[]`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1242

Determines whether all the members of an array satisfy the specified test.

##### Type Parameters

###### S

`S`

##### Parameters

###### predicate

(`value`, `index`, `array`) => `value is S`

A function that accepts up to three arguments. The every method calls
the predicate function for each element in the array until the predicate returns a value
which is coercible to the Boolean value false, or until the end of the array.

###### thisArg?

`any`

An object to which the this keyword can refer in the predicate function.
If thisArg is omitted, undefined is used as the this value.

##### Returns

`this is readonly S[]`

##### Inherited from

`ReadonlyArray.every`

#### Call Signature

> **every**(`predicate`, `thisArg?`): `boolean`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1251

Determines whether all the members of an array satisfy the specified test.

##### Parameters

###### predicate

(`value`, `index`, `array`) => `unknown`

A function that accepts up to three arguments. The every method calls
the predicate function for each element in the array until the predicate returns a value
which is coercible to the Boolean value false, or until the end of the array.

###### thisArg?

`any`

An object to which the this keyword can refer in the predicate function.
If thisArg is omitted, undefined is used as the this value.

##### Returns

`boolean`

##### Inherited from

`ReadonlyArray.every`

***

### filter()

#### Call Signature

> **filter**\<`S`\>(`predicate`, `thisArg?`): `S`[]

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1278

Returns the elements of an array that meet the condition specified in a callback function.

##### Type Parameters

###### S

`S`

##### Parameters

###### predicate

(`value`, `index`, `array`) => `value is S`

A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.

###### thisArg?

`any`

An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.

##### Returns

`S`[]

##### Inherited from

`ReadonlyArray.filter`

#### Call Signature

> **filter**(`predicate`, `thisArg?`): `T`[]

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1284

Returns the elements of an array that meet the condition specified in a callback function.

##### Parameters

###### predicate

(`value`, `index`, `array`) => `unknown`

A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.

###### thisArg?

`any`

An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.

##### Returns

`T`[]

##### Inherited from

`ReadonlyArray.filter`

***

### find()

#### Call Signature

> **find**\<`S`\>(`predicate`, `thisArg?`): `undefined` \| `S`

Defined in: node\_modules/typescript/lib/lib.es2015.core.d.ts:350

Returns the value of the first element in the array where predicate is true, and undefined
otherwise.

##### Type Parameters

###### S

`S`

##### Parameters

###### predicate

(`value`, `index`, `obj`) => `value is S`

find calls predicate once for each element of the array, in ascending
order, until it finds one where predicate returns true. If such an element is found, find
immediately returns that element value. Otherwise, find returns undefined.

###### thisArg?

`any`

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

##### Returns

`undefined` \| `S`

##### Inherited from

`ReadonlyArray.find`

#### Call Signature

> **find**(`predicate`, `thisArg?`): `undefined` \| `T`

Defined in: node\_modules/typescript/lib/lib.es2015.core.d.ts:351

##### Parameters

###### predicate

(`value`, `index`, `obj`) => `unknown`

###### thisArg?

`any`

##### Returns

`undefined` \| `T`

##### Inherited from

`ReadonlyArray.find`

***

### findIndex()

> **findIndex**(`predicate`, `thisArg?`): `number`

Defined in: node\_modules/typescript/lib/lib.es2015.core.d.ts:362

Returns the index of the first element in the array where predicate is true, and -1
otherwise.

#### Parameters

##### predicate

(`value`, `index`, `obj`) => `unknown`

find calls predicate once for each element of the array, in ascending
order, until it finds one where predicate returns true. If such an element is found,
findIndex immediately returns that element index. Otherwise, findIndex returns -1.

##### thisArg?

`any`

If provided, it will be used as the this value for each invocation of
predicate. If it is not provided, undefined is used instead.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.findIndex`

***

### flat()

> **flat**\<`A`, `D`\>(`this`, `depth?`): `FlatArray`\<`A`, `D`\>[]

Defined in: node\_modules/typescript/lib/lib.es2019.array.d.ts:47

Returns a new array with all sub-array elements concatenated into it recursively up to the
specified depth.

#### Type Parameters

##### A

`A`

##### D

`D` *extends* `number` = `1`

#### Parameters

##### this

`A`

##### depth?

`D`

The maximum recursion depth

#### Returns

`FlatArray`\<`A`, `D`\>[]

#### Inherited from

`ReadonlyArray.flat`

***

### flatMap()

> **flatMap**\<`U`, `This`\>(`callback`, `thisArg?`): `U`[]

Defined in: node\_modules/typescript/lib/lib.es2019.array.d.ts:36

Calls a defined callback function on each element of an array. Then, flattens the result into
a new array.
This is identical to a map followed by flat with depth 1.

#### Type Parameters

##### U

`U`

##### This

`This` = `undefined`

#### Parameters

##### callback

(`this`, `value`, `index`, `array`) => `U` \| readonly `U`[]

A function that accepts up to three arguments. The flatMap method calls the
callback function one time for each element in the array.

##### thisArg?

`This`

An object to which the this keyword can refer in the callback function. If
thisArg is omitted, undefined is used as the this value.

#### Returns

`U`[]

#### Inherited from

`ReadonlyArray.flatMap`

***

### forEach()

> **forEach**(`callbackfn`, `thisArg?`): `void`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1266

Performs the specified action for each element in an array.

#### Parameters

##### callbackfn

(`value`, `index`, `array`) => `void`

A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.

##### thisArg?

`any`

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

#### Returns

`void`

#### Inherited from

`ReadonlyArray.forEach`

***

### includes()

> **includes**(`searchElement`, `fromIndex?`): `boolean`

Defined in: node\_modules/typescript/lib/lib.es2016.array.include.d.ts:34

Determines whether an array includes a certain element, returning true or false as appropriate.

#### Parameters

##### searchElement

`T`

The element to search for.

##### fromIndex?

`number`

The position in this array at which to begin searching for searchElement.

#### Returns

`boolean`

#### Inherited from

`ReadonlyArray.includes`

***

### indexOf()

> **indexOf**(`searchElement`, `fromIndex?`): `number`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1227

Returns the index of the first occurrence of a value in an array.

#### Parameters

##### searchElement

`T`

The value to locate in the array.

##### fromIndex?

`number`

The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.indexOf`

***

### join()

> **join**(`separator?`): `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1215

Adds all the elements of an array separated by the specified separator string.

#### Parameters

##### separator?

`string`

A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.

#### Returns

`string`

#### Inherited from

`ReadonlyArray.join`

***

### keys()

> **keys**(): `IterableIterator`\<`number`\>

Defined in: node\_modules/typescript/lib/lib.es2015.iterable.d.ts:104

Returns an iterable of keys in the array

#### Returns

`IterableIterator`\<`number`\>

#### Inherited from

`ReadonlyArray.keys`

***

### lastIndexOf()

> **lastIndexOf**(`searchElement`, `fromIndex?`): `number`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1233

Returns the index of the last occurrence of a specified value in an array.

#### Parameters

##### searchElement

`T`

The value to locate in the array.

##### fromIndex?

`number`

The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.

#### Returns

`number`

#### Inherited from

`ReadonlyArray.lastIndexOf`

***

### map()

> **map**\<`U`\>(`callbackfn`, `thisArg?`): `U`[]

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1272

Calls a defined callback function on each element of an array, and returns an array that contains the results.

#### Type Parameters

##### U

`U`

#### Parameters

##### callbackfn

(`value`, `index`, `array`) => `U`

A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.

##### thisArg?

`any`

An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.

#### Returns

`U`[]

#### Inherited from

`ReadonlyArray.map`

***

### reduce()

#### Call Signature

> **reduce**(`callbackfn`): `T`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1290

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

###### callbackfn

(`previousValue`, `currentValue`, `currentIndex`, `array`) => `T`

A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduce`

#### Call Signature

> **reduce**(`callbackfn`, `initialValue`): `T`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1291

##### Parameters

###### callbackfn

(`previousValue`, `currentValue`, `currentIndex`, `array`) => `T`

###### initialValue

`T`

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduce`

#### Call Signature

> **reduce**\<`U`\>(`callbackfn`, `initialValue`): `U`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1297

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Type Parameters

###### U

`U`

##### Parameters

###### callbackfn

(`previousValue`, `currentValue`, `currentIndex`, `array`) => `U`

A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.

###### initialValue

`U`

If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.

##### Returns

`U`

##### Inherited from

`ReadonlyArray.reduce`

***

### reduceRight()

#### Call Signature

> **reduceRight**(`callbackfn`): `T`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1303

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Parameters

###### callbackfn

(`previousValue`, `currentValue`, `currentIndex`, `array`) => `T`

A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduceRight`

#### Call Signature

> **reduceRight**(`callbackfn`, `initialValue`): `T`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1304

##### Parameters

###### callbackfn

(`previousValue`, `currentValue`, `currentIndex`, `array`) => `T`

###### initialValue

`T`

##### Returns

`T`

##### Inherited from

`ReadonlyArray.reduceRight`

#### Call Signature

> **reduceRight**\<`U`\>(`callbackfn`, `initialValue`): `U`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1310

Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

##### Type Parameters

###### U

`U`

##### Parameters

###### callbackfn

(`previousValue`, `currentValue`, `currentIndex`, `array`) => `U`

A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array.

###### initialValue

`U`

If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.

##### Returns

`U`

##### Inherited from

`ReadonlyArray.reduceRight`

***

### slice()

> **slice**(`start?`, `end?`): `T`[]

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1221

Returns a section of an array.

#### Parameters

##### start?

`number`

The beginning of the specified portion of the array.

##### end?

`number`

The end of the specified portion of the array. This is exclusive of the element at the index 'end'.

#### Returns

`T`[]

#### Inherited from

`ReadonlyArray.slice`

***

### some()

> **some**(`predicate`, `thisArg?`): `boolean`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1260

Determines whether the specified callback function returns true for any element of an array.

#### Parameters

##### predicate

(`value`, `index`, `array`) => `unknown`

A function that accepts up to three arguments. The some method calls
the predicate function for each element in the array until the predicate returns a value
which is coercible to the Boolean value true, or until the end of the array.

##### thisArg?

`any`

An object to which the this keyword can refer in the predicate function.
If thisArg is omitted, undefined is used as the this value.

#### Returns

`boolean`

#### Inherited from

`ReadonlyArray.some`

***

### toLocaleString()

> **toLocaleString**(): `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1200

Returns a string representation of an array. The elements are converted to string using their toLocaleString methods.

#### Returns

`string`

#### Inherited from

`ReadonlyArray.toLocaleString`

***

### toString()

> **toString**(): `string`

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1196

Returns a string representation of an array.

#### Returns

`string`

#### Inherited from

`ReadonlyArray.toString`

***

### values()

> **values**(): `IterableIterator`\<`T`\>

Defined in: node\_modules/typescript/lib/lib.es2015.iterable.d.ts:109

Returns an iterable of values in the array

#### Returns

`IterableIterator`\<`T`\>

#### Inherited from

`ReadonlyArray.values`
