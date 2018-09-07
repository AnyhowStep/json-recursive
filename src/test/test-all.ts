import * as tape from "tape";
import * as json from "../main";

tape(__filename + "-basic", (t) => {
    const x : any = {};
    const y : any = {};
    x.y = y;
    y.x = x;
    const str = json.stringifyOrError(x);
    const obj = json.parse(str);

    t.assert(obj.y === obj.y.x.y, "x.y === x.y.x.y");
    t.assert(obj.y.x === obj, "x.y.x === x");

    t.end();
});

tape(__filename + "-array", (t) => {
    const arr : any[] = [];
    arr.push(arr);
    const str = json.stringifyOrError(arr);
    const obj = json.parse(str);

    t.assert(obj === obj[0], "arr === arr[0]");
    t.assert(obj[0] === obj[0][0], "arr[0] === arr[0][0]");

    t.end();
});

tape(__filename + "-nested", (t) => {
    const x : any = {};
    x.y = {};
    x.z = {};
    x.y.z = x.z;
    x.z.y = x.y;
    x.x = x;

    const str = json.stringifyOrError(x);
    const obj = json.parse(str);

    t.assert(obj.y === obj.z.y, "x.y === x.z.y");
    t.assert(obj.z === obj.y.z, "x.z === x.y.z");
    t.assert(obj === obj.x, "x === x.x");

    t.end();
});

tape(__filename + "-nested-2", (t) => {
    const x : any = {};
    x.x = x;
    x.date = new Date();

    const str = json.stringifyOrError(x);
    const obj = json.parse(str);

    t.assert(obj === obj.x, "x === x.x");
    t.assert(obj.date === obj.x.date, "x.date === x.x.date");

    t.end();
});

tape(__filename + "-include-error", (t) => {
    const x : any = {};
    x.x = x;
    x.error = new Error("This is a test message");

    const str = json.stringifyOrError(x, json.includeError);
    const obj = json.parse(str);

    t.assert(obj === obj.x, "x === x.x");
    t.assert(obj.error === obj.x.error, "x.error === x.x.error");
    t.assert(obj.error.name === "Error", "x.error.name === 'Error'");
    t.assert(obj.error.message === "This is a test message", "x.error.message === 'This is a test message'");
    t.assert(typeof obj.error.stack === "string", `typeof x.error.stack === 'string'; ${obj.error.stack}`);

    t.end();
});

tape(__filename + "-ignore-leading-underscore-key", (t) => {
    const x : any = {};
    x._x = x;
    x.y = {
        x : x,
        _x : x,
    };

    const str = json.stringifyOrError(x);
    const obj = json.parse(str);

    t.assert(obj === obj.y.x, "x === x.y.x");
    t.assert(obj.y === obj.y.x.y, "x.y === x.y.x.y");
    t.assert(obj === obj._x, "x === x._x");
    t.assert(obj === obj.y._x, "x === x.y._x");

    t.end();
});

tape(__filename + "-ignore-leading-underscore-key-2", (t) => {
    const x : any = {};
    x._x = x;
    x.y = {
        x : x,
        _x : x,
    };

    const str = json.stringifyOrError(x, json.ignoreLeadingUnderscoreKey);
    const obj = json.parse(str);

    t.assert(obj === obj.y.x, "x === x.y.x");
    t.assert(obj.y === obj.y.x.y, "x.y === x.y.x.y");
    t.assert(obj.hasOwnProperty("_x") === false, "x._x does not exist");
    t.assert(obj.y.hasOwnProperty("_x") === false, "x.y._x does not exist");

    t.end();
});

tape(__filename + "-chain-replacers", (t) => {
    const x : any = {};
    x.x = x;
    x.error = new Error("This is a test message");
    x._x = x;
    x.y = {
        x : x,
        _x : x,
    };

    const str = json.stringifyOrError(x, json.chainReplacers(
        json.includeError,
        json.ignoreLeadingUnderscoreKey
    ));
    const obj = json.parse(str);

    t.assert(obj === obj.x, "x === x.x");
    t.assert(obj.error === obj.x.error, "x.error === x.x.error");
    t.assert(obj.error.name === "Error", "x.error.name === 'Error'");
    t.assert(obj.error.message === "This is a test message", "x.error.message === 'This is a test message'");
    t.assert(typeof obj.error.stack === "string", `typeof x.error.stack === 'string'; ${obj.error.stack}`);

    t.assert(obj === obj.y.x, "x === x.y.x");
    t.assert(obj.y === obj.y.x.y, "x.y === x.y.x.y");
    t.assert(obj.hasOwnProperty("_x") === false, "x._x does not exist");
    t.assert(obj.y.hasOwnProperty("_x") === false, "x.y._x does not exist");

    t.end();
});