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


export interface Iterator<T> {
    hasNext():boolean;
    next():T;
}


/**
 * An abstract interface specifying
 * all the available statistical functions.
 */
export interface Processable {
    get(idx:number):number;
    each(fn:(v:number, i:number)=>any);
    toArray():Array<number>;
    createIterator():Iterator<number>;

    size():number;
    sum():number;
    max():number;
    min():number;
    mean():number;
    stdev():number;
    median():number;
    entropy(log:number):number;

    joint(otherData:Processable):FunzoJointData;
    correl<U>(otherData:Processable):number;
}


/**
 * An iterator which is able to skip elements
 * based on provided filter function. It is
 * the cornerstone of lazily processed arrays
 * in Funzo.
 */
class SkippingIterator<T> implements Iterator<T> {

    private data:Array<T>;

    private filterFn:(T)=>boolean;

    private i:number;

    private internalIdx:number;

    constructor(data:Array<T>, filterFn:(T)=>boolean) {
        this.data = data;
        this.filterFn = filterFn;
        this.i = 0;
        this.internalIdx = -1;
    }

    private findNextMatch(updateInternalPointer:boolean=false) {
        let i = this.internalIdx + 1;
        let tmp = this.data[i];
        let ans = undefined;

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
    }

    next():T {
        const ans = this.findNextMatch(true);
        if (ans !== undefined) {
            this.i += 1;
        }
        return ans;
    }

    hasNext():boolean {
        return this.findNextMatch() !== undefined;
    }
}

/**
 * An iterator providing lazily processed array of values T
 * wrapping a value U we actually care about.
 */
class MapIterator<T, U> {

    private iterator:SkippingIterator<T>;

    private data:Array<T>;

    private mapFn:(T)=>U;

    private filterFn:(T)=>boolean;


    constructor(data:Array<T>, filterFn:(T)=>boolean, mapFn:(T)=>U) {
        this.iterator = new SkippingIterator<T>(data, filterFn);
        this.mapFn = mapFn;
        this.filterFn = filterFn;
    }

    next():U {
        return this.mapFn(this.iterator.next());
    }

    hasNext():boolean {
        return this.iterator.hasNext();
    }
}

/**
 * An object used to modify a lazily filtered array.
 */
export class DataModifier<T> {

    private data:Array<T>;

    private accessorFn:(T)=>number;

    private filterFn:(T)=>boolean;

    constructor(accessorFn:(T)=>number, filterFn:(T)=>boolean, data:Array<T>) {
        this.accessorFn = accessorFn;
        this.filterFn = filterFn;
        this.data = data;
    }

    /**
     * Swap two elements with indices i1 and i2.
     */
    swap(i1:number, i2:number):void {
        if (i1 === i2) {
            return;

        } else if (!this.filterFn) {
            if (i1 < this.data.length && i2 < this.data.length) {
                [this.data[i1], this.data[i2]] = [this.data[i2], this.data[i1]];

            } else {
                throw new Error('Invalid index');
            }

        } else {
            if (i1 > i2) {
                [i1, i2] = [i2, i1];
            }
            let r1 = null, r2 = null;
            let tmp = 0;
            for (let i = 0; i < this.data.length; i += 1) {
                if (this.filterFn(this.data[i])) {
                    if (tmp === i1) {
                        r1 = i;
                    }
                    if (tmp === i2) {
                        r2 = i;
                    }
                    if (r1 !== null && r2 !== null) {
                        [this.data[r1], this.data[r2]] = [this.data[r2], this.data[r1]];
                        break;
                    }
                    tmp += 1;
                }
            }
            if (r1 === null || r2 === null) {
                throw new Error('Invalid index');
            }
        }
    }

    toArray():Array<T> {
        return this.data.filter(this.filterFn);
    }
}

/**
 * A core implementation of Processable
 */
class FunzoList<T> implements Processable {

    private data:Array<T>;

    private accessorFunc:(T)=>number;

    private filterFunc:(T)=>boolean;

    constructor(accessorFunc:(T)=>number, filterFunc:(T)=>boolean, data:Array<T>) {
        this.accessorFunc = accessorFunc;
        this.filterFunc = filterFunc;
        this.data = data;
    }

    public createIterator():MapIterator<T, number> {
        return new MapIterator<T, number>(this.data, this.filterFunc, this.accessorFunc);
    }

    toString():string {
        return '[object FunzoList]';
    }

    size():number {
        if (!this.filterFunc) {
            return this.data.length;

        } else {
            let i = 0;
            const iter = this.createIterator();
            while (iter.hasNext()) {
                iter.next();
                i += 1;
            }
            return i;
        }
    }

    get(idx:number):number {
        if (!this.filterFunc) {
            return this.accessorFunc(this.data[idx]);

        } else {
            let i = 0;
            let tmp:T;
            for (let i2 = 0; i2 < this.data.length; i2 += 1) {
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
    }

    toArray():Array<number> {
        return this.data
                .filter(this.filterFunc ? this.filterFunc : (x)=>true)
                .map(this.accessorFunc);
    }

    /**
     * Iterates over data and applies passed function.
     * To break the iteration function must return false.
     *
     * @param fn - a function applied to each item
     */
    each(fn:(v:number, i:number)=>any) {
        const iter:MapIterator<T, number> = this.createIterator();
        let i = 0;
        while (iter.hasNext()) {
            if (fn.call(this, iter.next(), i) === false) {
                break;
            }
            i += 1;
        }
    }

    private walkThrough(fn:(v:number, i:number)=>any) {
        const iter:MapIterator<T, number> = this.createIterator();
        let i = 0;
        let ans;
        while (iter.hasNext()) {
            ans = fn(iter.next(), i);
            if (ans === false) {
                break;
            }
            i += 1;
        }
    }

    /**
     * Calculates sum of provided numbers. If a non-number is encountered NaN is returned.
     *
     * @returns {*}
     */
     sum():number {
        let total:number = 0;

        this.walkThrough((x:number, i:number) => {
            if (typeof x !== 'number') {
                total = NaN;
                return false;
            }
            total += x;
        });
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

        this.walkThrough((x:number, i:number) => {
            if (typeof x !== 'number') {
                maxVal = NaN;
                return false;

            } else if (x > maxVal) {
                maxVal = x;
            }
        });
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

        this.walkThrough((x:number, i:number) => {
                if (typeof x !== 'number') {
                    minVal = NaN;
                    return false;

                } else if (x < minVal) {
                    minVal = x;
                }
        });
        return minVal;
    }

    private meanAndSize():{mean:number; size:number} {
        let total = 0;
        let num = 0;
        this.walkThrough((v:number, i:number) => {
            num += 1;
            total += v;
        });
        if (num > 0) {
            return {mean: total / num, size: num };
        }
        return {mean: NaN, size: num};
    }

    /**
     * Calculates arithmetic mean of provided numbers
     *
     */
    mean():number {
        return this.meanAndSize().mean;
    }

    /**
     * Calculates standard deviation of the sample
     *
     * @returns {*} standard deviation of the sample or NaN in case
     * the value cannot be calculated
     */
    stdev():number {
        const {mean, size} = this.meanAndSize();
        let curr = 0;
        if (!isNaN(mean) && this.size() > 1) {
            this.walkThrough((v:number, i:number) => {
                curr += (v - mean) * (v - mean);
            });
            return Math.sqrt(curr / (size - 1));
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

        let iter1 = this.createIterator();
        let iter2 = otherData.createIterator();
        let m1 = 0;
        let m2 = 0;
        let numItems = 0;
        let v1;
        let v2;

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
    }

    /**
     * Calculates a median of the dataset. This function
     * alters the order of the data (but does not sort them)
     * to prevent exhausting RAM.
     *
     * The function uses [Quickselect](https://en.wikipedia.org/wiki/Quickselect)
     * algorithm.
     */
    median():number {
        let self = this;

        if (this.size() === 0) {
            return NaN;
        }

        let modifier = new DataModifier(this.accessorFunc, this.filterFunc, this.data);

        function partition(left, right, pivotIdx):number {
            let pivotValue = self.get(pivotIdx);
            let realPivotIdx = left;

            modifier.swap(pivotIdx, right);
            for (let i = left; i <= right; i += 1) {
                if (self.get(i) < pivotValue) {
                    modifier.swap(i, realPivotIdx);
                    realPivotIdx += 1;
                }
            }
            modifier.swap(right, realPivotIdx);
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

    /**
     * Calculate Shannon entropy assuming the data represent
     * list of probabilities (i.e. values 0 <= p <= 1). In
     * case an incorrect value is encountered, NaN is returned.
     *
     * @param base - base of the logarithm
     */
    entropy(base:number):number {
        let ans = 0;
        let tmp;
        for (let i = 0; i < this.size(); i += 1) {
            tmp = this.get(i);
            if (tmp < 0 || tmp > 1) {
                return NaN;
            }
            ans += tmp * Math.log(tmp);
        }
        return -ans / Math.log(base);
    }

    joint(otherData:Processable):FunzoJointData {
        return new FunzoJointData(this, otherData);
    }
}


/**
 * A wrapper object providing access to data manipulation.
 */
export class FunzoData<T> {

    private data:Array<T>;

    private filterFn:((v:T)=>boolean);

    constructor(data:Array<T>, filter?:(v:T)=>boolean) {
        this.data = data;
        this.filterFn = filter ? filter : null;
    }

    /**
     * This is an essential function providing access to Processable
     * data set (i.e. the set where all the stat. functions are available).
     */
    map(fn?:(v:T)=>number):Processable {
        return new FunzoList<T>(fn ? fn : (x) => x, this.filterFn, this.data);
    }

    /**
     *
     */
    filter(fn?:(v:T)=>boolean):FunzoData<T> {
        let newFilter:(v:T)=>boolean;

        if (this.filterFn) {
            newFilter = (v:T) => {
                return this.filterFn(v) && fn(v);
            };

        } else {
            newFilter = fn;
        }
        return new FunzoData(this.data, newFilter);
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
        return new FunzoList<T>(convert, this.filterFn, this.data);
    }

    round(places:number):Processable {
        function convert (v:number):number {
            return parseFloat(v.toFixed(places));
        }
        // int terms of types this is actually wrong (number vs. T)
        return new FunzoList<T>(convert, this.filterFn, this.data);
    }

    sample(size:number):FunzoData<T> {
        function randomInt(fromNum, toNum) {
            return Math.floor(Math.random() * (toNum - fromNum)) + fromNum;
        }
        if (size <= 0 || size > this.data.length) {
            throw new Error('Sample size must be between zero and the size of the dataset');
        }
        for (let i = 0; i < size; i += 1) {
            const randIdx = randomInt(i, this.data.length);
            const tmp = this.data[i];
            this.data[i] = this.data[randIdx];
            this.data[randIdx] = tmp;
        }
        return new FunzoData<T>(this.data.slice(0, size));
    }

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
    probs(key?:(v:any)=>string):Processable {
        const probs = Object.create(null);
        const ans = [];
        let item;
        if (key === undefined) {
            key = (x) => x;
        }
        for (let i = 0; i < this.data.length; i += 1) {
            item = key(this.data[i]);
            probs[item] = probs[item] !== undefined ? probs[item] + 1 : 1;
        }
        for (let p in probs) {
            ans.push(probs[p] / this.data.length);
        }
        return new FunzoList<T>((x)=>x, null, ans); // no need to pass filter (already applied)
    }
}


/**
 * Represents a joint probability distribution based on two samples
 */
export class FunzoJointData {

    private list1:Processable;
    private list2:Processable;

    constructor(list1:Processable, list2:Processable) {
        this.list1 = list1;
        this.list2 = list2;
    }

    mi(base:number) {
        const probs12 = Object.create(null);
        const probs1 = Object.create(null);
        const probs2 = Object.create(null);
        const iter1 = this.list1.createIterator();
        const iter2 = this.list2.createIterator();
        let total = 0;
        while (iter1.hasNext() && iter2.hasNext()) {
            let v1 = String(iter1.next());
            let v2 = String(iter2.next());
            let v1v2 = v1 + ':' + v2;
            probs12[v1v2] = probs12[v1v2] !== undefined ? probs12[v1v2] + 1 : 1;
            probs1[v1] = probs1[v1] !== undefined ? probs1[v1] + 1 : 1;
            probs2[v2] = probs2[v2] !== undefined ? probs2[v2] + 1 : 1;
            total += 1;
        }
        let ans = 0;
        let pairs = Object.keys(probs12);
        for (let i = 0; i < pairs.length; i += 1) {
            let vals = pairs[i].split(':');
            ans += probs12[pairs[i]] / pairs.length
                    * Math.log( (probs12[pairs[i]] / pairs.length) /
                            ( (probs1[vals[0]] / total) * (probs2[vals[1]] / total) )
                      );
        }
        return ans / Math.log(base);
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
    return new FunzoList<T>(accessorFunc ? accessorFunc : (x)=>x, null, data);
}
