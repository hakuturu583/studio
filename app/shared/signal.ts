//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

export type Signal<T> = Promise<T> & {
  resolve: (arg0: T) => void;
  reject: (arg0: Error) => void;
};

export default function signal<T = void>(): Signal<T> {
  let resolve;
  let reject;
  const promise: any = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.resolve = resolve;
  promise.reject = reject;
  return promise;
}