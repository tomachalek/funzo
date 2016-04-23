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
 * This file contains orzo's library of useful functions
 */
var Data = (function () {
    function Data(data, accessorFunc) {
        this.data = data;
        this.accessorFunc = accessorFunc ? accessorFunc : function (t) { return t; };
    }
    Data.prototype.toString = function () {
        return '[object Data]';
    };
    Data.prototype.size = function () {
        return this.data.length;
    };
    Data.prototype.get = function (idx) {
        return this.accessorFunc(this.data[idx]);
    };
    Data.prototype.set = function (idx, v) {
        this.data[idx] = v;
    };
    /**
     * Iterates over data and applies passed function.
     * To break the iteration function must return false.
     *
     * @param {function} fn a function with signature function (value, index)
     */
    Data.prototype.each = function (fn) {
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
    Data.prototype.sum = function () {
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
    Data.prototype.max = function () {
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
    Data.prototype.min = function () {
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
    Data.prototype.mean = function () {
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
    Data.prototype.stdev = function () {
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
    Data.prototype.correl = function (otherData) {
        var len = Math.min(this.size(), otherData.size());
        var numerator = 0;
        var denominator1 = 0;
        var denominator2 = 0;
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
     */
    Data.prototype.median = function () {
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
    return Data;
}());
exports.Data = Data;
function D(data, accessorFunc) {
    return new Data(data, accessorFunc);
}
exports.D = D;
