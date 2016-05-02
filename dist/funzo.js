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
 * A core implementation of Processable
 */
var FunzoList = (function () {
    function FunzoList(accessorFunc, data) {
        this.accessorFunc = accessorFunc;
        this.data = data;
    }
    FunzoList.prototype.toString = function () {
        return '[object FunzoList]';
    };
    FunzoList.prototype.size = function () {
        return this.data.length;
    };
    FunzoList.prototype.get = function (idx) {
        return this.accessorFunc(this.data[idx]);
    };
    FunzoList.prototype.set = function (idx, v) {
        this.data[idx] = v;
    };
    FunzoList.prototype.toArray = function () {
        return this.data.map(this.accessorFunc);
    };
    /**
     * Iterates over data and applies passed function.
     * To break the iteration function must return false.
     *
     * @param {function} fn a function with signature function (value, index)
     */
    FunzoList.prototype.each = function (fn) {
        for (var i = 0; i < this.data.length; i += 1) {
            if (fn.call(this, this.get(i), i) === false) {
                break;
            }
        }
    };
    /**
     * Calculates sum of provided numbers. If a non-number is encountered NaN is returned.
     *
     * @returns {*}
     */
    FunzoList.prototype.sum = function () {
        var total = 0;
        for (var i = 0; i < this.size(); i += 1) {
            var x = this.get(i);
            if (typeof x !== 'number') {
                return NaN;
            }
            total += x;
        }
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
        for (var i = 1; i < this.size(); i += 1) {
            var x = this.get(i);
            if (typeof x !== 'number') {
                return NaN;
            }
            else if (x > maxVal) {
                maxVal = x;
            }
        }
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
        for (var i = 1; i < this.size(); i += 1) {
            var x = this.get(i);
            if (typeof x !== 'number') {
                return NaN;
            }
            else if (x < minVal) {
                minVal = x;
            }
        }
        return minVal;
    };
    /**
     * Calculates arithmetic mean of provided numbers
     *
     */
    FunzoList.prototype.mean = function () {
        if (this.size() > 0) {
            return this.sum() / this.size();
        }
        return NaN;
    };
    /**
     * Calculates standard deviation of the sample
     *
     * @returns {*} standard deviation of the sample or NaN in case
     * the value cannot be calculated
     */
    FunzoList.prototype.stdev = function () {
        var mean = this.mean();
        var curr = 0;
        if (!isNaN(mean) && this.size() > 1) {
            for (var i = 0; i < this.size(); i += 1) {
                curr += (this.get(i) - mean) * (this.get(i) - mean);
            }
            return Math.sqrt(curr / (this.size() - 1));
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
        if (this.size() === otherData.size()) {
            var m1 = this.mean();
            var m2 = otherData.mean();
            for (var i = 0; i < len; i += 1) {
                numerator += (this.get(i) - m1) * (otherData.get(i) - m2);
                denominator1 += (this.get(i) - m1) * (this.get(i) - m1);
                denominator2 += (otherData.get(i) - m2) * (otherData.get(i) - m2);
            }
            return numerator / Math.sqrt((denominator1 * denominator2));
        }
        else {
            return NaN;
        }
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
        function swap(i, j) {
            var tmp = self.data[i];
            self.data[i] = self.data[j];
            self.data[j] = tmp;
        }
        function partition(left, right, pivotIdx) {
            var pivotValue = self.get(pivotIdx);
            var realPivotIdx = left;
            swap(pivotIdx, right);
            for (var i = left; i <= right; i += 1) {
                if (self.get(i) < pivotValue) {
                    swap(i, realPivotIdx);
                    realPivotIdx += 1;
                }
            }
            swap(right, realPivotIdx);
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
    function FunzoData(data) {
        this.data = data;
    }
    /**
     * This is an essential function providing access to Processable
     * data set (i.e. the set where all the stat. functions are available).
     */
    FunzoData.prototype.map = function (fn) {
        return new FunzoList(fn ? fn : function (x) { return x; }, this.data);
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
        return new FunzoList(convert, this.data);
    };
    FunzoData.prototype.round = function (places) {
        function convert(v) {
            return parseFloat(v.toFixed(places));
        }
        // int terms of types this is actually wrong (number vs. T)
        return new FunzoList(convert, this.data);
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
        return new FunzoList(function (x) { return x; }, ans);
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
    /**
     * Mutual information
     */
    FunzoJointData.prototype.mi = function (base) {
        var probs12 = Object.create(null);
        var probs1 = Object.create(null);
        var probs2 = Object.create(null);
        var limit = Math.min(this.list1.size(), this.list2.size());
        for (var i = 0; i < limit; i += 1) {
            var v1 = String(this.list1.get(i));
            var v2 = String(this.list2.get(i));
            var v1v2 = v1 + ':' + v2;
            probs12[v1v2] = probs12[v1v2] !== undefined ? probs12[v1v2] + 1 : 1;
            probs1[v1] = probs1[v1] !== undefined ? probs1[v1] + 1 : 1;
            probs2[v2] = probs2[v2] !== undefined ? probs2[v2] + 1 : 1;
        }
        var ans = 0;
        var pairs = Object.keys(probs12);
        for (var i = 0; i < pairs.length; i += 1) {
            var vals = pairs[i].split(':');
            ans += probs12[pairs[i]] / pairs.length
                * Math.log((probs12[pairs[i]] / pairs.length) /
                    ((probs1[vals[0]] / limit) * (probs2[vals[1]] / limit)));
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
    return new FunzoList(accessorFunc ? accessorFunc : function (x) { return x; }, data);
}
exports.wrapArray = wrapArray;
