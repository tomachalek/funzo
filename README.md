# Funzo - a bunch of core descriptive statistics (and related) functions

Funzo wraps an array of arbitrary items and provides functions to calculate
their basic statistical properties:

  * sum
  * maximum value
  * minimum value
  * mean
  * median
  * standard deviation
  * entropy.

It can also calculate some properties describing a relationship between
two data sets:

  * correlation
  * mutual information.

It is designed to prefer memory savings over array access complexity.
You can filter your data multiple times:

```js
Funzo(data)
    .filter(x => x > 0)
    .filter(x => x % 2 === 0)
    .map()
    .mean()
```

and yet there will be no subsets of the original array in RAM. Funzo
filters data in a lazy way which makes it suitable for sequential processing
(it is what aggregation functions actually do) but random access time
complexity is *O(n)*.

Funzo comes with *d.ts* TypeScript declaration file which makes
writing code much easier when using a compatible editor (VScode, Atom,
WebStorm,...).

```js
/// <reference path="/path/to/funzo.d.ts" />
```


## Available interfaces

### FunzoData type (a wrapper for processed data)

*FunzoData* represents a wrapper for raw user data with structured
items of different types, including items we have to filter out. Some
*FunzoData* methods produce other *FunzoData* but most of them
return *Processable* type (see below) which represent a cleaned data.

* **filter**(fn:(v:T)=&gt;boolean):FunzoData
* **sample**(size:number):FunzoData
* **map**(fn?:(v:T)=&gt;number):Processable
* **numerize**():Processable
* **round**(places):Processable
* **probs**(key?:(v:any)=&gt;string):Processable

### Processable type (a processable variant of FunzoData)

*Processable* type represents cleaned data.

* **get**(idx:number):number
* **each**(fn:(v:number, i:number)=&gt;any)
* **toArray()**:Array<number>
* **size**():number
* **sum**():number
* **max**():number
* **min**():number
* **mean**():number
* **stdev**():number
* **correl**&lt;U&gt;(otherData:Processable):number
* **median**():number
* **entropy**(base:number):number
* **joint**(otherData:Processable):FunzoJointData


### FunzoJointData

This type is used for joint probabilities.

* **mi**(base:number):number - Mutual information


## How to use Funzo

### > make Funzo available in your code

```js
let Funzo = require('funzo').Funzo;
```


### > wrap your data

```js
let someData = [1, 2, 7, 10, 0, 1, -1, 7];
let procData = Funzo(someData);


let structuredData = [{m: 5}, {m: 10}, {m: 15}, {m: 20}];
let procData2 = Funzo(structuredData);
```

### > tell Funzo how to access the actual values

```
someData.map();

procData2.map((x)=>x.m);
```

## Examples

### Simple arrays

```js

let values1 = [10, 20, 30, 40];
let mean1 = Funzo(values1).map().mean();
let median1 = Funzo(values1).map().median();
// by calling map() we tell Funzo how to access numeric values within the array.
// In case the items are numbers themselves, an empty argument can be used
// which tells Funzo to use an identity (x)=>x
```

### Arrays with structured items

```js
// to be able to work with lists of objects where numeric values
// are wrapped in objects we pass a custom function to map():
let values2 = [{m: 5}, {m: 10}, {m: 15}, {m: 20}];
let stdev2 = Funzo(values2).map((item)=>item.m).stdev();
```

### Helper map functions

```js
// if you want to convert invalid values or parse string-encoded numbers
// automatically you can use numerize() instead of map() + manual handling:

let sumRawData = Funzo(['1', '2.7', null, {'foo': 'x'}]).numerize().sum();
// (should produce 3.7)
```

```js
// you can also round input values of an array:

Funzo([3.1416, 2.79, 1.59]).round(1).mean();
// now you actually work with [3.1, 2.8, 1.6]
```

### Creating a sample from a big array

```js
// we can create a sample from a bigger array:
let stdev3 = Funzo(superArray).sample(1000).map().stdev();
```

### Calculating correlation between two datasets

```js
// when calculating correlation, different instances can be combined:
Funzo(values1).map().correl(Funzo(values2).map((item)=>item.m));
```

### Calculating entropy

```js
let data = [{name: 'john'}, {name: 'paula'}, {name: 'john'}, {name: 'dana'}];

Funzo(data).probs((x)=>x.name).entropy(2);
```

### Calculating mutual information of two datasets

```js
let vals1 = [1, 2, 3, 4, 5, 6];
let vals2 = [1, 2, 2, 4, 6, 6];

Funzo(val1).map().joint(Funzo(vals2).map()).mi(2);
```

## Simplified interface

In some cases it can be more convenient to use a simplified version of the interace:

```js
let wrapArray = require('funzo').wrapArray;

let mean = wrapArray([{v: 1}, {v: 2}, {v: 3}, {v: 4}, {v: 5}], (x)=>x.v).stdev();
```
