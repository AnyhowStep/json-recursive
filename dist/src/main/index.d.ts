export declare type ReplacerDelegate = (this: any, key: string, value: any) => any;
export declare const defaultReplacer: ReplacerDelegate;
export declare const ignoreLeadingUnderscoreKey: ReplacerDelegate;
export declare const includeError: ReplacerDelegate;
export declare function chainReplacers(...replacers: ReplacerDelegate[]): ReplacerDelegate;
export declare function toPathStr(path: string[]): string;
export declare function stringify(raw: any, replacer?: ReplacerDelegate, path?: string[], closed?: {
    value: any;
    path: string[];
}[]): undefined | string;
export declare function stringifyOrError(raw: any, replacer?: ReplacerDelegate): string;
export declare function findAtPath(raw: any, path: string[]): any;
export declare function resolveRecursiveObjects(root: any, cur: any, recursionKey?: string, path?: string[]): any;
export declare function parse(str: string, recursionKey?: string): any;
export declare function createStringifyOrError(...replacers: ReplacerDelegate[]): (raw: any) => string;
