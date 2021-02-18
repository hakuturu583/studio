//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

/** Return a Promise resolved after @param ms milliseconds */
export default function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}