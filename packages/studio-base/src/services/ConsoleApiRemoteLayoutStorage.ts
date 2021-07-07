// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PanelsState } from "@foxglove/studio-base/";
import ConsoleApi from "@foxglove/studio-base/services/ConsoleApi";
import { LayoutID, ISO8601Timestamp } from "@foxglove/studio-base/services/ILayoutStorage";
import {
  IRemoteLayoutStorage,
  RemoteLayout,
  RemoteLayoutMetadata,
} from "@foxglove/studio-base/services/IRemoteLayoutStorage";

export default class ConsoleApiRemoteLayoutStorage implements IRemoteLayoutStorage {
  constructor(private api: ConsoleApi) {}

  async getLayouts(): Promise<readonly RemoteLayoutMetadata[]> {
    const { layouts } = await this.api.getLayouts();
    return layouts.map(({ id, name, timestamp }) => ({
      id,
      name,
      timestamp: new Date(timestamp),
    }));
  }
  /*
  getLayout: (id: LayoutID) => Promise<RemoteLayout | undefined>;

  saveNewLayout: (params: {
    path: string[];
    name: string;
    data: PanelsState;
  }) => Promise<{ status: "success"; newMetadata: RemoteLayoutMetadata } | { status: "conflict" }>;

  updateLayout: (params: {
    targetID: LayoutID;
    path: string[];
    name: string;
    data: PanelsState;
    ifUnmodifiedSince: ISO8601Timestamp;
  }) => Promise<
    | { status: "success"; newMetadata: RemoteLayoutMetadata }
    | { status: "not-found" }
    | { status: "conflict" }
    | { status: "precondition-failed" }
  >;

  shareLayout: (params: {
    sourceID: LayoutID;
    path: string[];
    name: string;
    permission: "org_read" | "org_write";
  }) => Promise<
    | { status: "success"; newMetadata: RemoteLayoutMetadata }
    | { status: "not-found" }
    | { status: "conflict" }
  >;

  deleteLayout: (params: {
    targetID: LayoutID;
    ifUnmodifiedSince: ISO8601Timestamp;
  }) => Promise<{ status: "success" | "precondition-failed" }>;

  renameLayout: (params: {
    targetID: LayoutID;
    name: string;
    path: string[];
    ifUnmodifiedSince: ISO8601Timestamp;
  }) => Promise<
    | { status: "success"; newMetadata: RemoteLayoutMetadata }
    | { status: "not-found" }
    | { status: "conflict" }
    | { status: "precondition-failed" }
  >;
*/
}
