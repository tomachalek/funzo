/**
 * A bunch of essential descriptive statistics functions
 */
export declare class FunzoList<T> {
    private data;
    private accessorFunc;
    constructor(data: Array<T>, accessorFunc?: (T) => number);
    toString(): string;
    size(): number;
    get(idx: number): number;
    set(idx: number, v: T): void;
    /**
     * Iterates over data and applies passed function.
     * To break the iteration function must return false.
     *
     * @param {function} fn a function with signature function (value, index)
     */
    each(fn: (v: number, i: number) => boolean): void;
    /**
     * Calculates sum of provided numbers. If a non-number is encountered NaN is returned.
     *
     * @returns {*}
     */
    sum(): number;
    /**
     * Finds maximal element in the data. If there is
     * even a single non-numerical element then NaN is returned.
     *
     * @returns {number}
     */
    max(): number;
    /**
     * Finds maximal element in the data. If there is
     * even a single non-numerical element then NaN is returned.
     *
     * @returns {number}
     */
    min(): number;
    /**
     * Calculates arithmetic mean of provided numbers
     *
     */
    mean(): number;
    /**
     * Calculates standard deviation of the sample
     *
     * @returns {*} standard deviation of the sample or NaN in case
     * the value cannot be calculated
     */
    stdev(): number;
    /**
     * Calculates Pearson product-moment correlation coefficient
     * between this data and other data.
     * (http://en.wikipedia.org/wiki/Pearson_product-moment_correlation_coefficient)
     *
     * @param otherData
     * @returns {number}
     */
    correl<U>(otherData: FunzoList<U>): number;
    /**
     * Calculates a median of the dataset. This function
     * alters the order of the data (but does not sort them)
     * to prevent exhausting RAM.
     */
    median(): number;
}
export declare function Funzo<T>(accessorFunc: (T) => number): (d: Array<T>) => FunzoList<T>;
export declare function wrapArray<T>(data: Array<T>, accessorFunc?: (T) => number): FunzoList<T>;
export declare function numerize(v: any): number;
