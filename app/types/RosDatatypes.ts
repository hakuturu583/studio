//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import { RosMsgField } from "rosbag";

export type RosDatatype = {
  fields: RosMsgField[];
};

export type RosDatatypes = {
  [key: string]: RosDatatype;
};