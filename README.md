# Funzo - a bunch of simple descriptive statistics functions

## Available functions

* max()
* min()
* mean()
* median()
* stdev()
* correl()


## How to use Funzo


```js
let values = [10, 20, 30, 40];
console.log(funzo.Funzo()(values).mean());
console.log(funzo.Funzo()(values).median());


// to be able to work with lists of objects where numeric values 
// are wrapped in objects we pass a custom accessor function:
let values2 = [{m: 5}, {m: 10}, {m: 15}, {m: 20}];
console.log(funzo.Funzo((item)=>item.m)(values2).stdev());

// when calculating correlation, different instances can be combined:
console.log(funzo.Funzo()(values).correl(funzo.Funzo((item)=>item.m)(values2)));

// if you don't like a higher order function approach, an alternative
// function wrapArray() is available: 
let mean = funzo.wrapArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).mean();
let mean2 = funzo.wrapArray([{v: 1}, {v: 2}, {v: 3}, {v: 4}, {v: 5}], (x)=>x.v).mean();
console.log('mean: ', mean, ', mean2: ', mean2);

```