import * as sd from "schema-decorator";

export type ReplacerDelegate = (this : any, key : string, value : any) => any;
//Doesn't do anything
export const defaultReplacer : ReplacerDelegate = function (this : any, _key : string, value : any) : any {
    return value;
};
//Private fields are usually denoted with _leadingUnderscores
//This ReplacerDelegate lets you ignore private fields
export const ignoreLeadingUnderscoreKey : ReplacerDelegate = function (this : any, key : string, value : any) : any {
    if (key[0] == "_") {
        return undefined;
    }
    return value;
};
//JSON.stringify(new Error('test')) gives "{}"
//However, with this ReplacerDelegate, you will get
//`{"name":"Error","message":"test","stack":"Error: test\n    at <anonymous>:1:16"}`
export const includeError : ReplacerDelegate = function (this : any, _key : string, value : any) : any {
    if (value instanceof Error) {
        return {
            ...value,
            name    : value.name,
            message : value.message,
            stack   : value.stack,
        };
    } else {
        return value;
    }
};
export function chainReplacers (...replacers : ReplacerDelegate[]) : ReplacerDelegate {
    if (replacers.length == 0) {
        return defaultReplacer;
    }
    if (replacers.length == 1) {
        return replacers[0];
    }
    return (function (this : any, key : string, value : any) : any {
        for (let r of replacers) {
            value = r.bind(this)(key, value);
        }
        return value;
    });
}

export function toPathStr (path : string[]) {
    return path
        .map(s => JSON.stringify(s))
        .join(".");
}

/*
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify

    JSON.stringify() converts a value to JSON notation representing it:

    If the value has a toJSON() method,
    it's responsible to define what data will be serialized.

    Boolean, Number, and String objects are converted to the
    corresponding primitive values during stringification,
    in accord with the traditional conversion semantics.

    If undefined, a Function, or a Symbol is encountered during conversion
    it is either omitted (when it is found in an object) or censored to null
    (when it is found in an array).
    JSON.stringify() can also just return undefined when passing in "pure"
    values like JSON.stringify(function(){}) or JSON.stringify(undefined).

    All Symbol-keyed properties will be completely ignored,
    even when using the replacer function.

    The instances of Date implement the toJSON() function by returning a
    string (the same as date.toISOString()). Thus, they are treated as strings.

    The numbers Infinity and NaN, as well as the object null, are all considered null.

    All the other Object instances (including Map, Set, WeakMap, and WeakSet)
    will have only their enumerable properties serialized.
*/
export function stringify (raw : any, replacer : ReplacerDelegate = defaultReplacer, path : string[] = [], closed : { value : any, path : string[] }[] = []) : undefined|string {
    if (path.length == 0) {
        raw = replacer.bind(raw)("", raw);
    }

    /*
        Possible values for `typeof raw` are:
        + undefined
        + object (`typeof null` is object)
        + boolean
        + number
        + string
        + symbol
        + function

        We remove `null` from the list of possible types so that
        `object` is not `null`
    */
    if (raw === null) {
        return "null";
    }

    if (typeof raw != "object") {
        /*
            We have one of the following,
            + undefined
            + boolean
            + number
            + string
            + symbol
            + function
        */
       //Safe to use the "regular" JSON.stringify() here
       //The numbers Infinity and NaN, as well as the object null, are all considered null.
       return JSON.stringify(raw);
    }


    if (
        (raw instanceof Boolean) ||
        (raw instanceof Number) ||
        (raw instanceof String) ||
        //The instances of Date implement the toJSON() function by returning a string
        (raw instanceof Date)
    ) {
        return JSON.stringify(raw);
    }

    //Should this be before or after the .toJSON() check?
    for (let entry of closed) {
        if (entry.value === raw) {
            return JSON.stringify({
                $recursive : entry.path
            });
        }
    }
    closed.push({
        value : raw,
        path  : path,
    });

    if (raw.toJSON instanceof Function) {
        const result = raw.toJSON();
        return stringify(result, replacer, path, closed);
    }

    if (raw instanceof Array) {
        const result : string[] = [];
        for (let i=0; i<raw.length; ++i) {
            const v = replacer.bind(raw)(i.toString(), raw[i]);
            if (v === undefined) {
                result.push("null");
                continue;
            }

            const item = stringify(
                v,
                replacer,
                path.concat(i.toString()),
                closed
            );
            result.push((item == undefined) ?
                "null" :
                item
            );
        }
        return `[${result.join(",")}]`;
    }

    const result : string[] = [];
    for (let k in raw) {
        const v = replacer.bind(raw)(k, raw[k]);
        if (v === undefined) {
            continue;
        }

        const itemKey = JSON.stringify(k);
        const item = stringify(
            v,
            replacer,
            path.concat(k),
            closed
        );
        if (item === undefined) {
            continue;
        }

        result.push(`${itemKey}:${item}`);
    }
    return `{${result.join(",")}}`;
}

export function stringifyOrError (raw : any, replacer? : ReplacerDelegate) : string {
    const result = stringify(raw, replacer);
    if (typeof result == "string") {
        return result;
    } else {
        throw new Error(`Could not stringify input of type ${sd.toTypeStr(raw)}`);
    }
}

export function findAtPath (raw : any, path : string[]) {
    let result = raw;
    for (let p of path) {
        result = result[p];
    }
    return result;
}

const assertStrArray = sd.array(sd.string());

export function resolveRecursiveObjects (root : any, cur : any, recursionKey : string = "$recursive", path : string[] = []) : any {
    if (cur instanceof Object) {
        const keys = Object.keys(cur);
        if (keys.length == 1 && keys[0] == recursionKey) {
            //We have an object of the form { $recursive : any }
            const to = assertStrArray(
                toPathStr(path.concat(recursionKey)),
                cur["$recursive"]
            );
            return findAtPath(root, to);
        } else {
            //We have a "regular" object of the form { [k : string] : any }
            for (let k in cur) {
                cur[k] = resolveRecursiveObjects(
                    root,
                    cur[k],
                    recursionKey,
                    path.concat(k)
                );
            }
            return cur;
        }
    } else if (cur instanceof Array) {
        for (let i=0; i<cur.length; ++i) {
            cur[i] = resolveRecursiveObjects(
                root,
                cur[i],
                recursionKey,
                path.concat(i.toString()),
            );
        }
        return cur;
    } else {
        //Guaranteed to not have recursion
        return cur;
    }
}

export function parse (str : string, recursionKey : string = "$recursive") : any {
    const raw = JSON.parse(str);
    return resolveRecursiveObjects(raw, raw, recursionKey);
}

export function createStringifyOrError (...replacers : ReplacerDelegate[]) : (raw : any) => string {
    const replacer = chainReplacers(...replacers);
    return (raw : any) :string => {
        return stringifyOrError(raw, replacer);
    };
}
