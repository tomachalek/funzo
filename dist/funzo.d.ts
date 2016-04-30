/**
 * An abstract interface specifying
 * all the available statistical functions.
 */
export interface Processable {
    get(idx: number): number;
    each(fn: (v: number, i: number) => any): any;
    toArray(): Array<number>;
    size(): number;
    sum(): number;
    max(): number;
    min(): number;
    mean(): number;
    stdev(): number;
    median(): number;
    entropy(log: number): number;
    correl<U>(otherData: Processable): number;
}
/**
 * A wrapper object providing access to data manipulation.
 */
export declare class FunzoData<T> {
    private data;
    constructor(data: Array<T>);
    /**
     * This is an essential function providing access to Processable
     * data set (i.e. the set where all the stat. functions are available).
     */
    map(fn?: (v: T) => number): Processable;
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
 * This function produces a partially applied function
 * with a defined 'accessorFunc' argument. It offers a convenient way
 * how to perform multiple calculations on lists of the same type.
 */
export declare function Funzo<T>(data: Array<T>): FunzoData<T>;
export declare function wrapArray<T>(data: Array<T>, accessorFunc?: (T) => number): Processable;
