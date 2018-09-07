# `json-recursive`

Yet-another-recursive-`JSON.stringify()`-implementation.

-----

### Install

`npm install --save @anyhowstep/json-recursive`

-----

### Test

`npm run test-all`

-----

### Build

`npm run build`

-----

### Basic Usage (`stringify()`, `parse()`)

```ts
import * as json from "@anyhowstep/json-recursive";

const x : any = {};
const y : any = {};
x.y = y;
y.x = x;

//{"y":{"x":{"$recursive":[]}}}
const str = json.stringify(x);
//`obj` has same structure as `x`
const obj = json.parse(str);
```

```ts
import * as json from "@anyhowstep/json-recursive";

const arr : any[] = [];
arr.push(arr);

//[{"$recursive":[]}]
const str = json.stringify(arr);
//`obj` has same structure as `arr`
const obj = json.parse(str);
```

```ts
import * as json from "@anyhowstep/json-recursive";

const x : any = {};
x.y = {};
x.z = {};
x.y.z = x.z;
x.z.y = x.y;
x.x = x;

//{"y":{"z":{"y":{"$recursive":["y"]}}},"z":{"$recursive":["y","z"]},"x":{"$recursive":[]}}
const str = json.stringify(x);
//`obj` has same structure as `x`
const obj = json.parse(str);
```

```ts
import * as json from "@anyhowstep/json-recursive";

const x : any = {};
x.x = x;
x.date = new Date();

//{"x":{"$recursive":[]},"date":"2018-09-07T20:23:46.427Z"}
const str = json.stringify(x);
//`obj` has same structure as `x`
//But `obj.date` is of type `string`
//because JSON.stringify() does that.
const obj = json.parse(str);
```

`stringify()` may return `undefined`; particularly, `JSON.stringify(undefined)`.

`stringifyOrError()` will return `string` or throw an `Error`.

-----

### Caveats

As you can see, recursive objects have the structure,

```ts
{ $recursive : string[] }
```

Therefore, in general `$recursive` is a reserved field.

`TODO: Maybe allow one to set the field to use for recursion?`

-----

### `ReplacerDelegate`

`stringify()` allows you to use a `ReplacerDelegate`.

```ts
export type ReplacerDelegate = (this : any, key : string, value : any) => any;
```

```ts
import * as json from "@anyhowstep/json-recursive";
//`json.includeError` is a replacer delegate
//that stringifies instances of `Error`.
//Normally, instances of `Error` get stringified to empty objects.

const x : any = {};
x.x = x;
x.error = new Error("This is a test message");

//{"x":{"$recursive":[]},"error":{"name":"Error","message":"This is a test message","stack":"Error: This is a test message\n    at Test.tape"}}
const str = json.stringify(x, json.includeError);
//`obj` has same structure as `x`
//But `obj.error` is not an instance of `Error`
const obj = json.parse(str);
```

```ts
import * as json from "@anyhowstep/json-recursive";
//`json.ignoreLeadingUnderscoreKey` is a replacer delegate
//that ignores keys beginning with underscores.

const x : any = {};
x._x = x;
x.y = {
    x : x,
    _x : x,
};

//{"y":{"x":{"$recursive":[]}}}
const str = json.stringify(x, json.ignoreLeadingUnderscoreKey);
//`obj` has same structure as `x`
//But `obj._x` does not exist
//and `obj.y._x` does not exist
const obj = json.parse(str);
```

-----

### Chaining Replacers

`ReplacerDelegate`s may be chained.

```ts
const str = json.stringifyOrError(x, json.chainReplacers(
    json.includeError,
    json.ignoreLeadingUnderscoreKey
));
```