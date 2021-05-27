// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

import { LayoutMetadata, LayoutRecord } from "@foxglove/studio-base/types/storage";

export interface RemoteLayoutStorage {
  // get a list of layout metadata for the current user
  getCurrentUserLayouts: () => Promise<LayoutMetadata[]>;

  // get a list of latest shared layouts for the current user's current team
  getSharedLayouts: () => Promise<LayoutMetadata[]>;

  // get the full history of private layouts for a single layout name, for the current user
  getLayoutHistory: (name: string) => Promise<LayoutMetadata[]>;

  // get a layout record by UID
  getLayoutByID: (uid: string) => Promise<LayoutRecord[]>;

  // upload the current user layout to the private database
  putPrivateLayout: (layout: LayoutRecord) => Promise<void>;

  // upload the current layout to the shared space
  putSharedLayout: (layout: LayoutRecord) => Promise<void>;
}

const RemoteLayoutStorageContext = createContext<RemoteLayoutStorage | undefined>(undefined);

export function useRemoteLayoutStorage(): RemoteLayoutStorage {
  const ctx = useContext(RemoteLayoutStorageContext);
  if (ctx === undefined) {
    throw new Error("A LayoutStorage provider is required to useLayoutStorage");
  }
  return ctx;
}

export default RemoteLayoutStorageContext;
