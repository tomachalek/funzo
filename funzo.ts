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


export interface Processable {
    get(idx:number):number;
    each(fn:(v:number, i:number)=>any);
    toArray():Array<number>;

    size():number;
    sum():number;
    max():number;
    min():number;
    mean():number;
    stdev():number;
    correl<U>(otherData:Processable):number;
    median():number;
}


class FunzoList<T> implements Processable {

    private data:Array<T>;

    private accessorFunc:(T)=>number;

    constructor(accessorFunc:(T)=>number, data:Array<T>) {
        this.accessorFunc = accessorFunc;
        this.data = data;
    }

    toString():string {
        return '[object FunzoList]';
    }

    size():number {
        return this.data.length;
    }

    get(idx:number):number {
        return this.accessorFunc(this.data[idx]);
    }

    set(idx:number, v:T):void {
        this.data[idx] = v;
    }

    toArray():Array<number> {
        return this.data.map(this.accessorFunc);
    }

    /**
     * Iterates over data and applies passed function.
     * To break the iteration function must return false.
     *
     * @param {function} fn a function with signature function (value, index)
     */
    each(fn:(v:number, i:number)=>any) {
        for (let i = 0; i < this.data.length; i += 1) {
            if (fn.call(this, this.get(i), i) === false) {
                break;
            }
        }
    }

    /**
     * Calculates sum of provided numbers. If a non-number is encountered NaN is returned.
     *
     * @returns {*}
     */
     sum():number {
        let total:number = 0;

        for (let i = 0; i < this.size(); i += 1) {
            let x = this.get(i);
            if (typeof x !== 'number') {
                return NaN;
            }
            total += x;
        }
        return total;
    }

    /**
     * Finds maximal element in the data. If there is
     * even a single non-numerical element then NaN is returned.
     *
     * @returns {number}
     */
    max():number {
        let maxVal = this.get(0);

        for (let i = 1; i < this.size(); i += 1) {
            let x = this.get(i);
            if (typeof x !== 'number') {
                return NaN;

            } else if (x > maxVal) {
                maxVal = x;
            }
        }
        return maxVal;
    }

    /**
     * Finds maximal element in the data. If there is
     * even a single non-numerical element then NaN is returned.
     *
     * @returns {number}
     */
    min():number {
        let minVal = this.get(0);

        for (let i = 1; i < this.size(); i += 1) {
            let x = this.get(i);
            if (typeof x !== 'number') {
                return NaN;

            } else if (x < minVal) {
                minVal = x;
            }
        }
        return minVal;
    }

    /**
     * Calculates arithmetic mean of provided numbers
     *
     */
    mean():number {
        if (this.size() > 0) {
            return this.sum() / this.size();
        }
        return NaN;
    }

    /**
     * Calculates standard deviation of the sample
     *
     * @returns {*} standard deviation of the sample or NaN in case
     * the value cannot be calculated
     */
    stdev():number {
        let mean = this.mean();
        let curr = 0;
        if (!isNaN(mean) && this.size() > 1) {
            for (let i = 0; i < this.size(); i += 1) {
                curr += (this.get(i) - mean) * (this.get(i) - mean);
            }
            return Math.sqrt(curr / (this.size() - 1));
        }
        return NaN;
    }

    /**
     * Calculates Pearson product-moment correlation coefficient
     * between this data and other data.
     * (http://en.wikipedia.org/wiki/Pearson_product-moment_correlation_coefficient)
     *
     * @param otherData
     * @returns {number}
     */
    correl<U>(otherData:Processable):number {
        let len = Math.min(this.size(), otherData.size());
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;

        if (otherData instanceof FunzoData) {
            throw new Error('Please apply map() to the argument');
        }

        if (this.size() === otherData.size()) {
            let m1 = this.mean();
            let m2 = otherData.mean();
            for (let i = 0; i < len; i += 1) {
                numerator += (this.get(i) - m1) * (otherData.get(i) - m2);
                denominator1 += (this.get(i) - m1) * (this.get(i) - m1);
                denominator2 += (otherData.get(i) - m2) * (otherData.get(i) - m2);
            }
            return numerator / Math.sqrt((denominator1 * denominator2));

        } else {
            return NaN;
        }
    }

    /**
     * Calculates a median of the dataset. This function
     * alters the order of the data (but does not sort them)
     * to prevent exhausting RAM.
     */
    median():number {
        let self = this;

        if (this.size() === 0) {
            return NaN;
        }

        function swap(i, j) {
            let tmp = self.data[i];
            self.data[i] = self.data[j];
            self.data[j] = tmp;
        }

        function partition(left, right, pivotIdx):number {
            let pivotValue = self.get(pivotIdx);
            let realPivotIdx = left;

            swap(pivotIdx, right);
            for (let i = left; i <= right; i += 1) {
                if (self.get(i) < pivotValue) {
                    swap(i, realPivotIdx);
                    realPivotIdx += 1;
                }
            }
            swap(right, realPivotIdx);
            return realPivotIdx;
        }

        function quickSelect(n):number {
            let left = 0;
            let right = self.size() - 1;
            let pivotIdx;

            while (true) {
                if (left == right) {
                    return self.get(left);
                }
                pivotIdx = Math.floor((left + right) / 2);
                pivotIdx = partition(left, right, pivotIdx);
                if (n == pivotIdx) {
                    return self.get(n);

                } else if (n < pivotIdx) {
                    right = pivotIdx - 1;

                } else {
                    left = pivotIdx + 1;
                }
            }
        }
        let halfIdx = Math.floor(self.size() / 2);
        let m = quickSelect(halfIdx);
        let m2;
        if (self.size() % 2 == 0) {
            m2 = quickSelect(halfIdx - 1);
            return (m2 + m) / 2;

        } else {
            return m;
        }
    }
}



export class FunzoData<T> {

    private data:Array<T>;

    constructor(data:Array<T>) {
        this.data = data;
    }

    map(fn?:(v:T)=>number):Processable {
        return new FunzoList<T>(fn ? fn : (x) => x, this.data);
    }

    /**
     * A helper accessor function which always produces numbers
     * (number => number, string => parsed number, null/none/object => zero)
     */
    numerize(fallbackValue:number=0):Processable {
        function convert (v:any):number {
            if (typeof v === 'number') {
                return v;

            } else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
                return parseFloat(v);

            } else {
                return fallbackValue;
            }
        }
        return new FunzoList<T>(convert, this.data);
    }

    sample(size:number):FunzoData<T> {
        function randomInt(fromNum, toNum) {
            return Math.floor(Math.random() * (toNum - fromNum)) + fromNum;
        }
        if (size <= 0 || size > this.data.length) {
            throw new Error('Sample size must be between zero and the size of the dataset');
        }
        for (let i = 0; i < size; i += 1) {
            let randIdx = randomInt(i, this.data.length);
            let tmp = this.data[i];
            this.data[i] = this.data[randIdx];
            this.data[randIdx] = tmp;
        }
        return new FunzoData<T>(this.data.slice(0, size));
    }

    round(places:number):Processable {
        function convert (v:number):number {
            return parseFloat(v.toFixed(places));
        }
        // int terms of types this is actually wrong (number vs. T)
        return new FunzoList<T>(convert, this.data);
    }
}


/**
 * This function produces a partially applied function
 * with a defined 'accessorFunc' argument. It offers a convenient way
 * how to perform multiple calculations on lists of the same type.
 */
export function Funzo<T>(data:Array<T>):FunzoData<T> {
    return new FunzoData<T>(data);
}

export function wrapArray<T>(data:Array<T>, accessorFunc?:(T)=>number):Processable {
    return new FunzoList<T>(accessorFunc ? accessorFunc : (x)=>x, data);
}
