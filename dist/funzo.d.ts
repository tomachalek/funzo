export interface Iterator<T> {
    hasNext(): boolean;
    next(): T;
}
/**
 * An abstract interface specifying
 * all the available statistical functions.
 */
export interface Processable {
    get(idx: number): number;
    each(fn: (v: number, i: number) => any): any;
    toArray(): Array<number>;
    createIterator(): Iterator<number>;
    size(): number;
    sum(): number;
    max(): number;
    min(): number;
    mean(): number;
    stdev(): number;
    median(): number;
    entropy(log: number): number;
    joint(otherData: Processable): FunzoJointData;
    correl<U>(otherData: Processable): number;
}
/**
 * An object used to modify a lazily filtered array.
 */
export declare class DataModifier<T> {
    private data;
    private accessorFn;
    private filterFn;
    constructor(accessorFn: (T) => number, filterFn: (T) => boolean, data: Array<T>);
    /**
     * Swap two elements with indices i1 and i2.
     */
    swap(i1: number, i2: number): void;
    toArray(): Array<T>;
}
/**
 * A wrapper object providing access to data manipulation.
 */
export declare class FunzoData<T> {
    private data;
    private filterFn;
    constructor(data: Array<T>, filter?: (v: T) => boolean);
    /**
     * This is an essential function providing access to Processable
     * data set (i.e. the set where all the stat. functions are available).
     */
    map(fn?: (v: T) => number): Processable;
    /**
     *
     */
    filter(fn?: (v: T) => boolean): FunzoData<T>;
    /**
     * A helper accessor function which always produces numbers
     * (number => number, string => parsed number, null/none/object => zero)
     */
    numerize(fallbackValue?: number): Processable;
    round(places: number): Processable;
    sample(size: number): FunzoData<T>;
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
    probs(key?: (v: any) => string): Processable;
}
/**
 * Represents a joint probability distribution based on two samples
 */
export declare class FunzoJointData {
    private list1;
    private list2;
    constructor(list1: Processable, list2: Processable);
    mi(base: number): number;
}
/**
 * This function produces a partially applied function
 * with a defined 'accessorFunc' argument. It offers a convenient way
 * how to perform multiple calculations on lists of the same type.
 */
export declare function Funzo<T>(data: Array<T>): FunzoData<T>;
export declare function wrapArray<T>(data: Array<T>, accessorFunc?: (T) => number): Processable;
