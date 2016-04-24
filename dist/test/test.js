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
"use strict";
/// <reference path="../typings/main/ambient/mocha/index.d.ts" />
/// <reference path="../typings/main/definitions/chai/index.d.ts" />
var chai = require('chai');
var funzo_1 = require('../funzo');
describe('factory function Funzo()', function () {
    it('test instantiation and get()', function () {
        var data = funzo_1.Funzo([1, 2, 3]).map(function (v) { return -v; });
        var ans = [];
        for (var i = 0; i < 3; i += 1) {
            ans.push(data.get(i));
        }
        chai.assert.deepEqual(ans, [-1, -2, -3]);
    });
    it('test default accessor function x=>x', function () {
        var ans = [];
        funzo_1.Funzo([1, 2, 3]).map().each(function (v, i) {
            ans.push(v);
        });
        chai.assert.deepEqual(ans, [1, 2, 3]);
    });
    it('test numerize', function () {
        var ans = [];
        funzo_1.Funzo(['1', '1.5', 'foo', {}, null]).numerize().each(function (v, i) {
            ans.push(v);
        });
        chai.assert.deepEqual(ans, [1, 1.5, 0, 0, 0]);
    });
    it('random sample', function () {
        var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        var randomValues = [0.99, 0.9, 0.8, 0.7, 0.6];
        var i = 0;
        var tmp = Math.random;
        Math.random = function () {
            var ans = randomValues[i];
            i += 1;
            return ans;
        };
        var values2 = funzo_1.Funzo(values).sample(5);
        chai.assert.deepEqual(values2.data, [15, 14, 13, 12, 11]);
        Math.random = tmp;
    });
    it('too big random sample', function () {
        chai.assert.throws(function () {
            funzo_1.Funzo([1, 2]).sample(10);
        }, Error);
    });
    it('too small random sample', function () {
        chai.assert.throws(function () {
            funzo_1.Funzo([1, 2]).sample(0);
        }, Error);
    });
});
describe('each()', function () {
    var data = funzo_1.wrapArray(['a', 'b', 'c'], function (v) { return v.charCodeAt(0); });
    var ans = [];
    var idx = [];
    var thisValue;
    data.each(function (v, i) {
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
        var data = funzo_1.wrapArray([0, 1, 2, 3, 4]);
        var ans = [];
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
        var items = [1, 2, 3, 4.2, 5, 6.1, 7, 8, 9, 10.7];
        chai.assert.equal(funzo_1.wrapArray(items).sum(), 56);
    });
    it('empty list', function () {
        var items = [];
        chai.assert.equal(funzo_1.wrapArray(items).sum(), 0);
    });
    it('list with non numbers and NaN', function () {
        var items = ['a', 1, 2, NaN];
        chai.assert.isOk(isNaN(funzo_1.wrapArray(items).sum()));
    });
});
describe('sum() with accessor fn', function () {
    var customAccess = function (x) { return x[1]; };
    it('access to structured items with valid respective items', function () {
        var items = [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5]];
        chai.assert.equal(funzo_1.wrapArray(items, customAccess).sum(), 15);
    });
    it('access to structured items with some invalid items', function () {
        var items = [['a', 1], ['b', 2], ['c', 'foo'], ['d', 1], ['e', 5]];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items, customAccess).sum()));
    });
    it('access to structured items with NaN item', function () {
        var items = [['a', 1], ['b', 2], ['c', NaN], ['d', 1], ['e', 5]];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items, customAccess).sum()));
    });
});
describe('max()', function () {
    it('using valid data', function () {
        var items = [0.4, 1, 2.7, -10, 19, 91.9];
        chai.assert.equal(funzo_1.wrapArray(items).max(), 91.9);
    });
    it('on empty array', function () {
        chai.assert.isTrue(isNaN(funzo_1.wrapArray([]).max()));
    });
    it('invalid data (null item)', function () {
        var items = [0.4, 1, 2.7, null, 19, 91.9];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items).max()));
    });
});
describe('min()', function () {
    it('valid data', function () {
        var items = [0.4, 1, 2.7, -10, 19, 91];
        chai.assert.equal(funzo_1.wrapArray(items).min(), -10);
    });
    it('empty array', function () {
        chai.assert.isTrue(isNaN(funzo_1.wrapArray([]).min()));
    });
    it('invalid data (null value)', function () {
        var items = [0, 1, 2, null, 19, 91];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items).min()));
    });
});
describe('mean()', function () {
    it('general valid numbers', function () {
        var items = [1.1, 2, 3, 4.8, 5, 6, 7, 8, 9.8, 10.1];
        chai.assert.equal(funzo_1.wrapArray(items).mean().toPrecision(3), 5.68);
    });
    it('list with NaN item', function () {
        var items = [1.1, 5, NaN, 7];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items).mean()));
    });
    it('list with incorrect item', function () {
        var items = [1.1, 5, "it's me", 7];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items).mean()));
    });
    it('empty list should have average NaN', function () {
        chai.assert.isTrue(isNaN(funzo_1.wrapArray([]).mean()));
    });
});
describe("stdev()", function () {
    it('general valid numbers', function () {
        var items = [1, 2, 1, 2, 1, 2];
        chai.assert.equal(funzo_1.wrapArray(items).stdev().toPrecision(4), 0.5477);
    });
    it('list with NaN item', function () {
        var items = [1.1, 5, NaN, 7];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items).stdev()));
    });
    it('list with incorrect item', function () {
        var items = [1.1, 5, "it's me", 7];
        chai.assert.isTrue(isNaN(funzo_1.wrapArray(items).stdev()));
    });
    it('empty list should have average NaN', function () {
        chai.assert.isTrue(isNaN(funzo_1.wrapArray([]).stdev()));
    });
});
describe('correl()', function () {
    it('two equal vectors', function () {
        var values1 = [1, 3, 7, 8, 12, 3, 0, 4, 8, 10];
        var values2 = [1, 3, 7, 8, 12, 3, 0, 4, 8, 10];
        chai.assert.equal(funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2)), 1);
    });
    it('test positive correlation coefficient 1', function () {
        var values1 = [1, 2, 3, 4, 5, 6];
        var values2 = [1, 2, 3, 4, 5, 6];
        var ans = funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2));
        chai.assert.equal(ans.toFixed(2), '1.00');
    });
    it('negative correlation coefficient -1', function () {
        var values1 = [1, 2, 3, 4, 5, 6];
        var values2 = [6, 5, 4, 3, 2, 1];
        var ans = funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2));
        chai.assert.equal(ans.toFixed(2), '-1.00');
    });
    it('with correct arguments', function () {
        var values1 = [1, 2, 3, 4, 5, 6];
        var values2 = [4, 7, 3, 4, 1, 2];
        var ans = funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2));
        chai.assert.equal(ans.toFixed(6), '-0.695978');
    });
    it('empty arguments', function () {
        var values1 = [];
        var values2 = [];
        var ans = funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2));
        chai.assert.isTrue(isNaN(ans));
    });
    it('with non-numeric arguments', function () {
        var values1 = ['foo', 'bar'];
        var values2 = ['x', 'y'];
        var ans = funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2));
        chai.assert.isTrue(isNaN(ans));
    });
    it('with args of different lengths', function () {
        var values1 = [0, 1, 2, 3, 4, 5, 6];
        var values2 = [0, 1, 2];
        var ans = funzo_1.wrapArray(values1).correl(funzo_1.wrapArray(values2));
        chai.assert.isTrue(isNaN(ans));
    });
});
describe('median()', function () {
    var values = [
        70.24, 60.83, 85.13, 73.07, 95.93, 98.36, 25.59, 60.73, 32.21, 57.72,
        98.39, 42.23, 47.39, 61.58, 64.78, 66.71, 21.44, 61.58, 51.21, 18.78,
        69.33, 83.71, 72.75, 96.07, 59.69, 85.14, 89.58, 66.86, 22.29, 7.72,
        69.11, 48.53, 77.52, 10.23, 10.06, 18.04, 81.4, 3.46, 6.74, 10.9,
        88.57, 93.28, 75.38, 3.57, 40.93, 70.64, 13.98, 23.06, 44.94, 87.38
    ];
    it('array of an even size', function () {
        chai.assert.equal(funzo_1.wrapArray(values).median(), 61.205);
    });
    it('array of an odd size', function () {
        chai.assert.equal(funzo_1.wrapArray(values.slice(0, values.length - 1)).median(), 60.83);
    });
    it('test for an array of size 1', function () {
        var values = [70.7];
        chai.assert.equal(funzo_1.wrapArray(values).median(), 70.7);
    });
    it('test for an empty array', function () {
        chai.assert.isTrue(isNaN(funzo_1.wrapArray([]).median()));
    });
});
