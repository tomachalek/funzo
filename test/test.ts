/*
 * Copyright (C) 2016 Tomas Machalek
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/// <reference path="../typings/main/ambient/mocha/index.d.ts" />
/// <reference path="../typings/main/definitions/chai/index.d.ts" />

import chai = require('chai');
import { Funzo, wrapArray, numerize } from  '../funzo';

describe('factory function Funzo()', function () {
    
    it('test instantiation and get()', function () {
        let funzo = Funzo((v) => -v);
        let values = funzo([1, 2, 3]);
        let ans = [];
        
        for (let i = 0; i < 3; i += 1) {
            ans.push(values.get(i));
        }        
        
        chai.assert.deepEqual(ans, [-1, -2, -3]);
    });
});


describe('each()', function () {
    let data = wrapArray<string>(['a', 'b', 'c'], (v)=>v.charCodeAt(0));
    let ans = [];
    let idx = [];
    let thisValue;
                
    data.each(function (v:number, i:number) {
        ans.push(v);
        idx.push(i);
        thisValue = this;
        return true;
    });
    
    it('test value parameter', function () {
        chai.assert.deepEqual(ans, [97, 98, 99]);        
    });
    
    it('test index parameter', function () {
        chai.assert.deepEqual(idx, [0, 1, 2]);    
    });
    
    it("test 'this' value", function () {
        chai.assert.strictEqual(thisValue, data);    
    });
    
    it('return false breaks iteration', function () {
        let data = wrapArray([0, 1, 2, 3, 4]);
        let ans = [];

        data.each(function (v, i) {
            ans.push(v);
            if (i >= 2) {
                return false;
            }
        }); 
        chai.assert.deepEqual(ans, [0, 1, 2]);
    });    
});


describe('sum()', function () {
    it('valid result from a list of valid values', function () {
        let items = [1, 2, 3, 4.2, 5, 6.1, 7, 8, 9, 10.7];
        chai.assert.equal(wrapArray(items).sum(), 56);
    });
    
    it('empty list', function () {
        let items = [];
        chai.assert.equal(wrapArray(items).sum(), 0);
    });

    it('list with non numbers and NaN', function () {
        let items = ['a', 1, 2, NaN];
        chai.assert.isOk(isNaN(wrapArray(items).sum()));
    }); 
});

describe('sum() with accessor fn', function () {    
    let customAccess = (x) => x[1];

    it('access to structured items with valid respective items', function () {
        let items = [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]];
        chai.assert.equal(wrapArray(items, customAccess).sum(), 15);
    });

    it('access to structured items with some invalid items', function () {
        let items = [['a', 1], ['b', 2], ['c', 'foo'], ['d', 1], ['e', 5]];
        chai.assert.isTrue(isNaN(wrapArray(items, customAccess).sum()));
    });

    it('access to structured items with NaN item', function () {
        let items = [['a', 1], ['b', 2], ['c', NaN], ['d', 1], ['e', 5]];
        chai.assert.isTrue(isNaN(wrapArray(items, customAccess).sum()));
    });
});


describe('max()', function () {
    it('using valid data', function () {
        let items = [0.4, 1, 2.7, -10, 19, 91.9];
        chai.assert.equal(wrapArray(items).max(), 91.9);
    });

    it('on empty array', function () {
        chai.assert.isTrue(isNaN(wrapArray([]).max()));
    });

    it('invalid data (null item)', function () {
        let items = [0.4, 1, 2.7, null, 19, 91.9];
        chai.assert.isTrue(isNaN(wrapArray(items).max()));
    });
});


describe('min()', function () {
    it('valid data', function () {
        let items = [0.4, 1, 2.7, -10, 19, 91];
        chai.assert.equal(wrapArray(items).min(), -10);
    });

    it('empty array', function () {
        chai.assert.isTrue(isNaN(wrapArray([]).min()));
    });

    it('invalid data (null value)', function () {
        let items = [0, 1, 2, null, 19, 91];
        chai.assert.isTrue(isNaN(wrapArray(items).min()));
    });
});


describe('mean()', function () {

    it('general valid numbers', function () {
        let items = [1.1, 2, 3, 4.8, 5, 6, 7, 8, 9.8, 10.1];
        chai.assert.equal(wrapArray(items).mean().toPrecision(3), 5.68);
    });

    it('list with NaN item', function () {
        let items = [1.1, 5, NaN, 7];
        chai.assert.isTrue(isNaN(wrapArray(items).mean()));
    });

    it('list with incorrect item', function () {
        let items = [1.1, 5, "it's me", 7];
        chai.assert.isTrue(isNaN(wrapArray(items).mean()));
    });

    it('empty list should have average NaN', function () {
        chai.assert.isTrue(isNaN(wrapArray([]).mean()));
    });
});


describe("stdev()", function () {
    

    it('general valid numbers', function () {
        let items = [1, 2, 1, 2, 1, 2];
        chai.assert.equal(wrapArray(items).stdev().toPrecision(4), 0.5477);
    });
    
    it('list with NaN item', function () {
        let items = [1.1, 5, NaN, 7];
        chai.assert.isTrue(isNaN(wrapArray(items).stdev()));
    });
    
    it('list with incorrect item', function () {
        let items = [1.1, 5, "it's me", 7];
        chai.assert.isTrue(isNaN(wrapArray(items).stdev()));
    });
    
    it('empty list should have average NaN', function () {
        chai.assert.isTrue(isNaN(wrapArray([]).stdev()));
    });
});


describe('correl()', function () {

    it('two equal vectors', function () {
        let values1 = [1, 3, 7, 8, 12, 3, 0, 4, 8, 10];
        let values2 = [1, 3, 7, 8, 12, 3, 0, 4, 8, 10];

        chai.assert.equal(wrapArray(values1).correl(wrapArray(values2)), 1);
    });

    it('test positive correlation coefficient 1', function () {
        let values1 = [1, 2, 3, 4, 5, 6];
        let values2 = [1, 2, 3, 4, 5, 6];

        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.equal(ans.toFixed(2), '1.00');
    });

    it('negative correlation coefficient -1', function () {
        let values1 = [1, 2, 3, 4, 5, 6];
        let values2 = [6, 5, 4, 3, 2, 1];

        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.equal(ans.toFixed(2), '-1.00');
    });

    it('with correct arguments', function () {
        let values1 = [1, 2, 3, 4, 5, 6];
        let values2 = [4, 7, 3, 4, 1, 2];

        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.equal(ans.toFixed(6), '-0.695978');
    });

    it('empty arguments', function () {
        let values1 = [];
        let values2 = [];

        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.isTrue(isNaN(ans));
    });

    it('with non-numeric arguments', function () {
        let values1 = ['foo', 'bar'];
        let values2 = ['x', 'y'];

        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.isTrue(isNaN(ans));
    });

    it('with args of different lengths', function () {
        let values1 = [0, 1, 2, 3, 4, 5, 6];
        let values2 = [0, 1, 2];
        
        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.isTrue(isNaN(ans));
    });
});


describe('median()', function () {
    let values = [
        70.24, 60.83, 85.13, 73.07, 95.93, 98.36, 25.59, 60.73, 32.21, 57.72,
        98.39, 42.23, 47.39, 61.58, 64.78, 66.71, 21.44, 61.58, 51.21, 18.78,
        69.33, 83.71, 72.75, 96.07, 59.69, 85.14, 89.58, 66.86, 22.29, 7.72,
        69.11, 48.53, 77.52, 10.23, 10.06, 18.04, 81.4, 3.46, 6.74, 10.9,
        88.57, 93.28, 75.38, 3.57, 40.93, 70.64, 13.98, 23.06, 44.94, 87.38
    ];    

    it('array of an even size', function () {       
        chai.assert.equal(wrapArray(values).median(), 61.205);        
    });
    
    it('array of an odd size', function () {
       chai.assert.equal(wrapArray(values.slice(0, values.length - 1)).median(), 60.83); 
    });

    it('test for an array of size 1', function () {
        let values = [70.7];

        chai.assert.equal(wrapArray(values).median(), 70.7);
    });

    it('test for an empty array', function () {
        chai.assert.isTrue(isNaN(wrapArray([]).median()));
    });
});


describe ('numerize()', function () {
    
    it('test float number', function () {
        chai.assert.equal(numerize(1.71), 1.71);    
    });
    
    it('test integer number', function () {
        chai.assert.equal(numerize(2), 2);    
    });
    
    it('test float number string', function () {
        chai.assert.equal(numerize('3.14'), 3.14);    
    });
    
    it('test int number string', function () {
        chai.assert.equal(numerize('3'), 3);    
    });
    
    it('test null', function () {
        chai.assert.equal(numerize(null), 0);    
    });
    
    it('test undefined', function () {
        chai.assert.equal(numerize(undefined), 0);    
    });
    
    it('test object', function () {
        chai.assert.equal(numerize({'foo': 'bar'}), 0);    
    });
});