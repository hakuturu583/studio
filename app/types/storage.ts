// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";

export type Time = {
  sec: number;
  nsec: number;
};

export type LayoutMetadata = {
  uid: string;
  name: string;
  createdAt: Time;
  lastUpdated: Time;
  creatorUid: string;
};

export type UserMetadata = {
  uid: string;
  email: string;
};

export type TeamMetadata = {
  uid: string;
  name: string;
};

export type TeamRecord = TeamMetadata & {
  layoutMetadata: LayoutMetadata[];
  userIds: string[];
};

export type UserRecord = UserMetadata & {
  teamIds: string[];
  layoutMetadata: LayoutMetadata[];
};

export type LayoutRecord = LayoutMetadata & {
  data: PanelsState;
};
