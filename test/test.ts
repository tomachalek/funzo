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
import { Funzo, wrapArray, Processable, DataModifier } from  '../funzo';


describe('FunzoData - general', function () {

    it('test instantiation and get()', function () {
        let data = Funzo([1, 2, 3]).map((v) => -v);
        let ans = [];

        for (let i = 0; i < 3; i += 1) {
            ans.push(data.get(i));
        }

        chai.assert.deepEqual(ans, [-1, -2, -3]);
    });

    it('test default accessor function x=>x', function () {
        let ans = [];

        Funzo([1, 2, 3]).map().each((v, i) => {
            ans.push(v);
        });

        chai.assert.deepEqual(ans, [1, 2, 3]);
    });

    it('test numerize', function () {
        let ans = [];

        Funzo(['1', '1.5', 'foo', {}, null]).numerize().each((v, i) => {
            ans.push(v);
        });

        chai.assert.deepEqual(ans, [1, 1.5, 0, 0, 0]);
    });

    it('random sample', function () {
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        let randomValues = [0.99, 0.9, 0.8, 0.7, 0.6];
        let i = 0;
        let tmp = Math.random;
        Math.random = () => {
            let ans = randomValues[i];
            i += 1;
            return ans;
        }
        let values2:any = Funzo(values).sample(5);
        chai.assert.deepEqual(values2.data, [15, 14, 13, 12, 11]);
        Math.random = tmp;
    });

    it('too big random sample', function () {
        chai.assert.throws(() => {
            Funzo([1, 2]).sample(10);
        }, Error);
    });

    it('too small random sample', function () {
        chai.assert.throws(() => {
            Funzo([1, 2]).sample(0);
        }, Error);
    });

    it('test round()', function () {
        let values =   [1.45, 1.9, 1.44, 9.71, 0.01, 0.05];
        let expected = [1.4,  1.9, 1.4, 9.7, 0.00, 0.1];
        chai.assert.deepEqual(Funzo(values).round(1).toArray(), expected);
    });

    it('test freqs()', function () {
        let values = [{v: 'a'}, {v: 'b'}, {v: 'c'}, {v: 'c'}];
        let freqs = Funzo(values).probs((x)=>x.v).toArray().sort();
        chai.assert.deepEqual(freqs, [0.25, 0.25, 0.5]);
    });

    it('test freqs() of empty', function () {
        let freqs = Funzo([]).probs().toArray();
        chai.assert.deepEqual(freqs, []);
    });
});


describe('FunzoData.filter()', function () {

    it('test simple', function () {
        let items = [1, -3, 2, -4, 3, -5, 4, -6, 5, -7];

        let fd = Funzo(items).filter((v)=>(v >= 0));
        chai.assert.deepEqual(fd.map().toArray(), [1, 2, 3, 4, 5]);
    });

    it('test size', function () {
        let items = [1, -3, 2, -4, 3, -5, 4, -6, 5, -7];

        let fd = Funzo(items).filter((v)=>(v >= 0));
        chai.assert.equal(fd.map().size(), 5);
    });

    it('test fetch values', function () {
        let items = [78, 5, 0, 43, 3, 97, 23, 5, 68, 5, 8, 4, 44, 7, 34, 2, 89, 6, 82, 83];
        let filteredItems = items.filter(v => v % 2 == 0);
        let fd = Funzo(items).filter(v => v % 2 === 0).map();
        for (let i = 0; i < filteredItems.length; i += 1) {
            chai.assert.equal(fd.get(i), filteredItems[i]);
        }
    });

    it('test chained filters', function () {
        let items = [10, 12, 32, 46, 55, 71, 74, 87, 93, 106, 126, 129, 136, 138, 148, 172, 177, 186, 191, 192];
        let fd = Funzo(items).filter(x => x % 2 === 0).filter(x => x > 100);
        chai.assert.deepEqual(fd.map().toArray(), [106, 126, 136, 138, 148, 172, 186, 192]);
    });
});


describe('DataModifier', function () {

    it('test simple', function () {
        let items = [1, -3, 2, -4, 3, -5, 4, -6, 5, -7];
        let filter = x => x >= 0;

        let dm = new DataModifier(x=>x, filter, items);
        dm.swap(0, 4);
        let fd = Funzo(items).filter(filter);
        chai.assert.deepEqual(fd.map().toArray(), [5, 2, 3, 4, 1]);
    });


    it ('test empty', function () {
        let items = [];
        let filter = x => x >= 0;

        let dm = new DataModifier(x=>x, filter, items);
        dm.swap(0, 4);
        let fd = Funzo(items).filter(filter);
        chai.assert.deepEqual(fd.map().toArray(), []);
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

    it('args of different lengths (longer dataset is truncated)', function () {
        let values1 = [0, 1, 2, 3, 4, 5, 6];
        let values2 = [0, 1, 2];

        let ans = wrapArray(values1).correl(wrapArray(values2));
        chai.assert.equal(ans, 1);
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

    let values2 = [-3, -2, -1, 0, 1, 2, 3];

    it('filtered array (test swap works well)', function () {
        let m = Funzo(values2).filter(x => x >= 0).map().median();
        chai.assert.equal(m, 1.5);
    });

    it('array with forced pass-all filter', function () {
        let m = Funzo(values).filter(x => true).map().median();
        chai.assert.equal(m, 61.205);
    });
});


describe('entropy()', function () {

    it('common input data', function () {
        let values = [1, 1, 1, 2, 3, 3, 4, 1, 6, 7, 2, 1, 2, 0];
        let entropy = Funzo(values).probs().entropy(2);
        chai.assert.approximately(entropy, 2.4956, 0.00005);
    });

    it('all values same', function () {
        let values = [{v: 'a'}, {v: 'a'}, {v: 'a'}, {v: 'a'}];
        let entropy = Funzo(values).probs((x)=>x.v).entropy(2);
        chai.assert.equal(entropy, 0);
    });

    it('test probs directly', function () {
        let entropy = Funzo([0.5, 0.25, 0.25]).map().entropy(2);
        chai.assert.equal(entropy, 1.5);
    });

    it('test invalid probs values (negative value)', function () {
        let entropy = Funzo([-0.001, 0.25, 0.25]).map().entropy(2);
        chai.assert.isNaN(entropy);
    });

    it('test invalid probs values (value > 1)', function () {
        let entropy = Funzo([0.5, 1.0001, 0.25]).map().entropy(2);
        chai.assert.isNaN(entropy);
    });
});


describe('mi() - mutual information', function () {
    let v1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let v2 = [1, 2, 3, 4, 1, 4, 8, 2, 9, 10, 11, 0];
    let v3 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    it('common input data', function () {
        let ans = Funzo(v1).map().joint(Funzo(v2).map()).mi(2.71828);
        chai.assert.approximately(ans, 2.13833, 0.00005);
    });

    it('independent variables', function () {
        let ans = Funzo(v1).map().joint(Funzo(v3).map()).mi(2.71828);
        chai.assert.approximately(ans, 0, 0.00005);
    });

    it('dependent variables', function () {
        let ans = Funzo(v1).map().joint(Funzo(v1).map()).mi(2.71828);
        chai.assert.approximately(ans, 2.4849, 0.00005);
    });

    it('dependent variables', function () {
        let ans = Funzo(v1).map().joint(Funzo(v1).map()).mi(2.71828);
        chai.assert.approximately(ans, 2.4849, 0.00005);
    });

    it('different sizes', function () {
        let v4 = [1, 2];
        let ans = Funzo(v1).map().joint(Funzo(v4).map()).mi(2);
        chai.assert.approximately(ans, 1, 0.00005);
    });

    it('empty data', function () {
        let ans = Funzo([]).map().joint(Funzo([]).map()).mi(2);
        chai.assert.equal(ans, 0);
    });

});
