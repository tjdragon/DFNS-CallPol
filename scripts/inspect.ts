import { dfnsApi } from './DFNSCommon.js';

function getAllPropertyNames(obj: any): string[] {
    let props: string[] = [];
    do {
        props = props.concat(Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));
    return props.sort();
}

console.log("DfnsApiClient properties:", getAllPropertyNames(dfnsApi));
// @ts-ignore
console.log("dfnsApi.policies properties:", getAllPropertyNames(dfnsApi.policies || {}));
