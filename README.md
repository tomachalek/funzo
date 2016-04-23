# Funzo - a bunch of simple descriptive statistics functions

## Available functions

* max()
* min()
* mean()
* median()
* stdev()
* correl()


## How to use

```js
let Funzo = require('funzo').Funzo;

let values = [{v: 10}, {v: 20}, {v: 30}, {v: 40}]; 
let values2 = [{m: 5}, {m: 10}, {m: 15}, {m: 20}];
let funzo = Funzo((item)=>item.v);

console.log(funzo(values).mean());

console.log(funzo(values).median());

console.log(funzo(values).correl(Funzo((item)=>item.m)(values2)));

console.log(funzo(values).mean());
```