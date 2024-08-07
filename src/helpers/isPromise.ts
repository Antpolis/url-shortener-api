export function isPromise(promise: Promise<any>) {  
    return !!promise && typeof promise.then === 'function'
}