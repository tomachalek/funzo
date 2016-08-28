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
/**
 * An iterator which is able to skip elements
 * based on provided filter function. It is
 * the cornerstone of lazily processed arrays
 * in Funzo.
 */
var SkippingIterator = (function () {
    function SkippingIterator(data, filterFn) {
        this.data = data;
        this.filterFn = filterFn;
        this.i = 0;
        this.internalIdx = -1;
    }
    SkippingIterator.prototype.findNextMatch = function (updateInternalPointer) {
        if (updateInternalPointer === void 0) { updateInternalPointer = false; }
        var i = this.internalIdx + 1;
        var tmp = this.data[i];
        var ans = undefined;
        while (i < this.data.length) {
            tmp = this.data[i];
            if (!this.filterFn || this.filterFn(tmp)) {
                ans = tmp;
                break;
            }
            i += 1;
        }
        if (updateInternalPointer) {
            this.internalIdx = i;
        }
        return ans;
    };
    SkippingIterator.prototype.next = function () {
        var ans = this.findNextMatch(true);
        if (ans !== undefined) {
            this.i += 1;
        }
        return ans;
    };
    SkippingIterator.prototype.hasNext = function () {
        return this.findNextMatch() !== undefined;
    };
    return SkippingIterator;
}());
/**
 * An iterator providing lazily processed array of values T
 * wrapping a value U we actually care about.
 */
var MapIterator = (function () {
    function MapIterator(data, filterFn, mapFn) {
        this.iterator = new SkippingIterator(data, filterFn);
        this.mapFn = mapFn;
        this.filterFn = filterFn;
    }
    MapIterator.prototype.next = function () {
        return this.mapFn(this.iterator.next());
    };
    MapIterator.prototype.hasNext = function () {
        return this.iterator.hasNext();
    };
    return MapIterator;
}());
/**
 * An object used to modify a lazily filtered array.
 */
var DataModifier = (function () {
    function DataModifier(accessorFn, filterFn, data) {
        this.accessorFn = accessorFn;
        this.filterFn = filterFn;
        this.data = data;
    }
    /**
     * Swap two elements with indices i1 and i2.
     */
    DataModifier.prototype.swap = function (i1, i2) {
        if (i1 === i2) {
            return;
        }
        else if (!this.filterFn) {
            if (i1 < this.data.length && i2 < this.data.length) {
                _a = [this.data[i2], this.data[i1]], this.data[i1] = _a[0], this.data[i2] = _a[1];
            }
            else {
                throw new Error('Invalid index');
            }
        }
        else {
            if (i1 > i2) {
                _b = [i2, i1], i1 = _b[0], i2 = _b[1];
            }
            var r1 = null, r2 = null;
            var tmp = 0;
            for (var i = 0; i < this.data.length; i += 1) {
                if (this.filterFn(this.data[i])) {
                    if (tmp === i1) {
                        r1 = i;
                    }
                    if (tmp === i2) {
                        r2 = i;
                    }
                    if (r1 !== null && r2 !== null) {
                        _c = [this.data[r2], this.data[r1]], this.data[r1] = _c[0], this.data[r2] = _c[1];
                        break;
                    }
                    tmp += 1;
                }
            }
            if (r1 === null || r2 === null) {
                throw new Error('Invalid index');
            }
        }
        var _a, _b, _c;
    };
    DataModifier.prototype.toArray = function () {
        return this.data.filter(this.filterFn);
    };
    return DataModifier;
}());
exports.DataModifier = DataModifier;
/**
 * A core implementation of Processable
 */
var FunzoList = (function () {
    function FunzoList(accessorFunc, filterFunc, data) {
        this.accessorFunc = accessorFunc;
        this.filterFunc = filterFunc;
        this.data = data;
    }
    FunzoList.prototype.createIterator = function () {
        return new MapIterator(this.data, this.filterFunc, this.accessorFunc);
    };
    FunzoList.prototype.toString = function () {
        return '[object FunzoList]';
    };
    FunzoList.prototype.size = function () {
        if (!this.filterFunc) {
            return this.data.length;
        }
        else {
            var i = 0;
            var iter = this.createIterator();
            while (iter.hasNext()) {
                iter.next();
                i += 1;
            }
            return i;
        }
    };
    FunzoList.prototype.get = function (idx) {
        if (!this.filterFunc) {
            return this.accessorFunc(this.data[idx]);
        }
        else {
            var i = 0;
            var tmp = void 0;
            for (var i2 = 0; i2 < this.data.length; i2 += 1) {
                tmp = this.data[i2];
                if (this.filterFunc(tmp)) {
                    if (i === idx) {
                        return this.accessorFunc(tmp);
                    }
                    i += 1;
                }
            }
            return undefined;
        }
    };
    FunzoList.prototype.toArray = function () {
        return this.data
            .filter(this.filterFunc ? this.filterFunc : function (x) { return true; })
            .map(this.accessorFunc);
    };
    /**
     * Iterates over data and applies passed function.
     * To break the iteration function must return false.
     *
     * @param fn - a function applied to each item
     */
    FunzoList.prototype.each = function (fn) {
        var iter = this.createIterator();
        var i = 0;
        while (iter.hasNext()) {
            if (fn.call(this, iter.next(), i) === false) {
                break;
            }
            i += 1;
        }
    };
    FunzoList.prototype.walkThrough = function (fn) {
        var iter = this.createIterator();
        var i = 0;
        var ans;
        while (iter.hasNext()) {
            ans = fn(iter.next(), i);
            if (ans === false) {
                break;
            }
            i += 1;
        }
    };
    /**
     * Calculates sum of provided numbers. If a non-number is encountered NaN is returned.
     *
     * @returns {*}
     */
    FunzoList.prototype.sum = function () {
        var total = 0;
        this.walkThrough(function (x, i) {
            if (typeof x !== 'number') {
                total = NaN;
                return false;
            }
            total += x;
        });
        return total;
    };
    /**
     * Finds maximal element in the data. If there is
     * even a single non-numerical element then NaN is returned.
     *
     * @returns {number}
     */
    FunzoList.prototype.max = function () {
        var maxVal = this.get(0);
        this.walkThrough(function (x, i) {
            if (typeof x !== 'number') {
                maxVal = NaN;
                return false;
            }
            else if (x > maxVal) {
                maxVal = x;
            }
        });
        return maxVal;
    };
    /**
     * Finds maximal element in the data. If there is
     * even a single non-numerical element then NaN is returned.
     *
     * @returns {number}
     */
    FunzoList.prototype.min = function () {
        var minVal = this.get(0);
        this.walkThrough(function (x, i) {
            if (typeof x !== 'number') {
                minVal = NaN;
                return false;
            }
            else if (x < minVal) {
                minVal = x;
            }
        });
        return minVal;
    };
    FunzoList.prototype.meanAndSize = function () {
        var total = 0;
        var num = 0;
        this.walkThrough(function (v, i) {
            num += 1;
            total += v;
        });
        if (num > 0) {
            return { mean: total / num, size: num };
        }
        return { mean: NaN, size: num };
    };
    /**
     * Calculates arithmetic mean of provided numbers
     *
     */
    FunzoList.prototype.mean = function () {
        return this.meanAndSize().mean;
    };
    /**
     * Calculates standard deviation of the sample
     *
     * @returns {*} standard deviation of the sample or NaN in case
     * the value cannot be calculated
     */
    FunzoList.prototype.stdev = function () {
        var _a = this.meanAndSize(), mean = _a.mean, size = _a.size;
        var curr = 0;
        if (!isNaN(mean) && this.size() > 1) {
            this.walkThrough(function (v, i) {
                curr += (v - mean) * (v - mean);
            });
            return Math.sqrt(curr / (size - 1));
        }
        return NaN;
    };
    /**
     * Calculates Pearson product-moment correlation coefficient
     * between this data and other data.
     * (http://en.wikipedia.org/wiki/Pearson_product-moment_correlation_coefficient)
     *
     * @param otherData
     * @returns {number}
     */
    FunzoList.prototype.correl = function (otherData) {
        var len = Math.min(this.size(), otherData.size());
        var numerator = 0;
        var denominator1 = 0;
        var denominator2 = 0;
        if (otherData instanceof FunzoData) {
            throw new Error('Please apply map() to the argument');
        }
        var iter1 = this.createIterator();
        var iter2 = otherData.createIterator();
        var m1 = 0;
        var m2 = 0;
        var numItems = 0;
        var v1;
        var v2;
        while (iter1.hasNext() && iter2.hasNext()) {
            v1 = iter1.next();
            v2 = iter2.next();
            m1 += v1;
            m2 += v2;
            numItems += 1;
        }
        m1 /= numItems;
        m2 /= numItems;
        iter1 = this.createIterator();
        iter2 = otherData.createIterator();
        while (iter1.hasNext() && iter2.hasNext()) {
            v1 = iter1.next();
            v2 = iter2.next();
            numerator += (v1 - m1) * (v2 - m2);
            denominator1 += (v1 - m1) * (v1 - m1);
            denominator2 += (v2 - m2) * (v2 - m2);
        }
        return numerator / Math.sqrt((denominator1 * denominator2));
    };
    /**
     * Calculates a median of the dataset. This function
     * alters the order of the data (but does not sort them)
     * to prevent exhausting RAM.
     *
     * The function uses [Quickselect](https://en.wikipedia.org/wiki/Quickselect)
     * algorithm.
     */
    FunzoList.prototype.median = function () {
        var self = this;
        if (this.size() === 0) {
            return NaN;
        }
        var modifier = new DataModifier(this.accessorFunc, this.filterFunc, this.data);
        function partition(left, right, pivotIdx) {
            var pivotValue = self.get(pivotIdx);
            var realPivotIdx = left;
            modifier.swap(pivotIdx, right);
            for (var i = left; i <= right; i += 1) {
                if (self.get(i) < pivotValue) {
                    modifier.swap(i, realPivotIdx);
                    realPivotIdx += 1;
                }
            }
            modifier.swap(right, realPivotIdx);
            return realPivotIdx;
        }
        function quickSelect(n) {
            var left = 0;
            var right = self.size() - 1;
            var pivotIdx;
            while (true) {
                if (left == right) {
                    return self.get(left);
                }
                pivotIdx = Math.floor((left + right) / 2);
                pivotIdx = partition(left, right, pivotIdx);
                if (n == pivotIdx) {
                    return self.get(n);
                }
                else if (n < pivotIdx) {
                    right = pivotIdx - 1;
                }
                else {
                    left = pivotIdx + 1;
                }
            }
        }
        var halfIdx = Math.floor(self.size() / 2);
        var m = quickSelect(halfIdx);
        var m2;
        if (self.size() % 2 == 0) {
            m2 = quickSelect(halfIdx - 1);
            return (m2 + m) / 2;
        }
        else {
            return m;
        }
    };
    /**
     * Calculate Shannon entropy assuming the data represent
     * list of probabilities (i.e. values 0 <= p <= 1). In
     * case an incorrect value is encountered, NaN is returned.
     *
     * @param base - base of the logarithm
     */
    FunzoList.prototype.entropy = function (base) {
        var ans = 0;
        var tmp;
        for (var i = 0; i < this.size(); i += 1) {
            tmp = this.get(i);
            if (tmp < 0 || tmp > 1) {
                return NaN;
            }
            ans += tmp * Math.log(tmp);
        }
        return -ans / Math.log(base);
    };
    FunzoList.prototype.joint = function (otherData) {
        return new FunzoJointData(this, otherData);
    };
    return FunzoList;
}());
/**
 * A wrapper object providing access to data manipulation.
 */
var FunzoData = (function () {
    function FunzoData(data, filter) {
        this.data = data;
        this.filterFn = filter ? filter : null;
    }
    /**
     * This is an essential function providing access to Processable
     * data set (i.e. the set where all the stat. functions are available).
     */
    FunzoData.prototype.map = function (fn) {
        return new FunzoList(fn ? fn : function (x) { return x; }, this.filterFn, this.data);
    };
    /**
     *
     */
    FunzoData.prototype.filter = function (fn) {
        var _this = this;
        var newFilter;
        if (this.filterFn) {
            newFilter = function (v) {
                return _this.filterFn(v) && fn(v);
            };
        }
        else {
            newFilter = fn;
        }
        return new FunzoData(this.data, newFilter);
    };
    /**
     * A helper accessor function which always produces numbers
     * (number => number, string => parsed number, null/none/object => zero)
     */
    FunzoData.prototype.numerize = function (fallbackValue) {
        if (fallbackValue === void 0) { fallbackValue = 0; }
        function convert(v) {
            if (typeof v === 'number') {
                return v;
            }
            else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
                return parseFloat(v);
            }
            else {
                return fallbackValue;
            }
        }
        return new FunzoList(convert, this.filterFn, this.data);
    };
    FunzoData.prototype.round = function (places) {
        function convert(v) {
            return parseFloat(v.toFixed(places));
        }
        // int terms of types this is actually wrong (number vs. T)
        return new FunzoList(convert, this.filterFn, this.data);
    };
    FunzoData.prototype.sample = function (size) {
        function randomInt(fromNum, toNum) {
            return Math.floor(Math.random() * (toNum - fromNum)) + fromNum;
        }
        if (size <= 0 || size > this.data.length) {
            throw new Error('Sample size must be between zero and the size of the dataset');
        }
        for (var i = 0; i < size; i += 1) {
            var randIdx = randomInt(i, this.data.length);
            var tmp = this.data[i];
            this.data[i] = this.data[randIdx];
            this.data[randIdx] = tmp;
        }
        return new FunzoData(this.data.slice(0, size));
    };
    /**
     * Return a list of probabilites calculated based on
     * occurrences of individual items in original data.
     * Please note that returned lists are intended for
     * aggregation purposes - there is no mapping available
     * between the original data and these probability values
     * (i.e. you know that some value has a probability 'p' but
     * you do not know which value it is).
     *
     * @param key a function mapping from an original value to item identifier
     */
    FunzoData.prototype.probs = function (key) {
        var probs = Object.create(null);
        var ans = [];
        var item;
        if (key === undefined) {
            key = function (x) { return x; };
        }
        for (var i = 0; i < this.data.length; i += 1) {
            item = key(this.data[i]);
            probs[item] = probs[item] !== undefined ? probs[item] + 1 : 1;
        }
        for (var p in probs) {
            ans.push(probs[p] / this.data.length);
        }
        return new FunzoList(function (x) { return x; }, null, ans); // no need to pass filter (already applied)
    };
    return FunzoData;
}());
exports.FunzoData = FunzoData;
/**
 * Represents a joint probability distribution based on two samples
 */
var FunzoJointData = (function () {
    function FunzoJointData(list1, list2) {
        this.list1 = list1;
        this.list2 = list2;
    }
    FunzoJointData.prototype.mi = function (base) {
        var probs12 = Object.create(null);
        var probs1 = Object.create(null);
        var probs2 = Object.create(null);
        var iter1 = this.list1.createIterator();
        var iter2 = this.list2.createIterator();
        var total = 0;
        while (iter1.hasNext() && iter2.hasNext()) {
            var v1 = String(iter1.next());
            var v2 = String(iter2.next());
            var v1v2 = v1 + ':' + v2;
            probs12[v1v2] = probs12[v1v2] !== undefined ? probs12[v1v2] + 1 : 1;
            probs1[v1] = probs1[v1] !== undefined ? probs1[v1] + 1 : 1;
            probs2[v2] = probs2[v2] !== undefined ? probs2[v2] + 1 : 1;
            total += 1;
        }
        var ans = 0;
        var pairs = Object.keys(probs12);
        for (var i = 0; i < pairs.length; i += 1) {
            var vals = pairs[i].split(':');
            ans += probs12[pairs[i]] / pairs.length
                * Math.log((probs12[pairs[i]] / pairs.length) /
                    ((probs1[vals[0]] / total) * (probs2[vals[1]] / total)));
        }
        return ans / Math.log(base);
    };
    return FunzoJointData;
}());
exports.FunzoJointData = FunzoJointData;
/**
 * This function produces a partially applied function
 * with a defined 'accessorFunc' argument. It offers a convenient way
 * how to perform multiple calculations on lists of the same type.
 */
function Funzo(data) {
    return new FunzoData(data);
}
exports.Funzo = Funzo;
function wrapArray(data, accessorFunc) {
    return new FunzoList(accessorFunc ? accessorFunc : function (x) { return x; }, null, data);
}
exports.wrapArray = wrapArray;
