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
    correl<U>(otherData: Processable): number;
    median(): number;
}
export declare class FunzoData<T> {
    private data;
    constructor(data: Array<T>);
    map(fn?: (v: T) => number): Processable;
    /**
     * A helper accessor function which always produces numbers
     * (number => number, string => parsed number, null/none/object => zero)
     */
    numerize(fallbackValue?: number): Processable;
    sample(size: number): FunzoData<T>;
    round(places: number): Processable;
}
/**
 * This function produces a partially applied function
 * with a defined 'accessorFunc' argument. It offers a convenient way
 * how to perform multiple calculations on lists of the same type.
 */
export declare function Funzo<T>(data: Array<T>): FunzoData<T>;
export declare function wrapArray<T>(data: Array<T>, accessorFunc?: (T) => number): Processable;
