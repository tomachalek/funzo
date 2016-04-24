# Funzo - a bunch of simple descriptive statistics functions

## Available functions


### FunzoData type

* **map**(fn?:(v:T)=&gt;number):Processable
* **numerize**():Processable
* **sample**(size:number):FunzoData

### Processable type

* **get**(idx:number):number;
* **each**(fn:(v:number, i:number)=&gt;any);
* **size**():number;
* **sum**():number;
* **max**():number;
* **min**():number;
* **mean**():number;
* **stdev**():number;
* **correl**&lt;U&gt;(otherData:Processable):number;
* **median**():number;


## How to use Funzo

```js
let Funzo = require('funzo').Funzo;

let values1 = [10, 20, 30, 40];
let mean1 = Funzo(values1).map().mean();
let median1 = Funzo(values1).map().median();
// by calling map() we tell Funzo how to access numeric values within the array.
// In case the items are numbers themselves, an empty argument can be used
// which tells Funzo to use an identity (x)=&lt;x


// to be able to work with lists of objects where numeric values
// are wrapped in objects we pass a custom function to map():
let values2 = [{m: 5}, {m: 10}, {m: 15}, {m: 20}];
let stdev2 = Funzo(values2).map((item)=>item.m).stdev();

// when calculating correlation, different instances can be combined:
let correlation12 = Funzo(values1).map().correl(Funzo(values2).map((item)=>item.m));

// if you want to convert invalid values or parse string-encoded numbers
// automatically you can use 'numerize' instead of 'map':

let sumRawData = Funzo(['1', '2.7', null, {'foo': 'x'}]).numerize().sum();
// (should produce 3.7)

// we can create a sample from a bigger array:
let stdev3 = Funzo(superArray).sample(1000).map().stdev();
```

```js
let wrapArray = require('funzo').wrapArray;
// if you don't like a higher order function approach, an alternative
// function wrapArray() is available:
let mean = wrapArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).mean();
let mean2 = wrapArray([{v: 1}, {v: 2}, {v: 3}, {v: 4}, {v: 5}], (x)=>x.v).mean();
```

**Caution**: Please note that the API is in initial phase and thus may change here and there.