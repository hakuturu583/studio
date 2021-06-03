// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import RemoteLayoutStorageContext, {
  RemoteLayoutStorage,
} from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import { LayoutMetadata, LayoutRecord } from "@foxglove/studio-base/types/storage";
import filterMap from "@foxglove/studio-base/util/filterMap";

function getOrSetDefault<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
  const result = map.get(key);
  if (result != undefined) {
    return result;
  }
  map.set(key, defaultValue);
  return defaultValue;
}

class MockRemoteLayoutStorage implements RemoteLayoutStorage {
  private layoutsById = new Map<string, LayoutRecord>();
  private currentUserLayoutHistoryByName = new Map<string, LayoutRecord[]>();
  private sharedLayoutHistoryByName = new Map<string, LayoutRecord[]>();

  getCurrentUserLayouts = async (): Promise<LayoutMetadata[]> => {
    return filterMap(
      this.currentUserLayoutHistoryByName.values(),
      (history) => history[history.length - 1],
    ).map(({ data: _, ...metadata }) => metadata);
  };

  getSharedLayouts = async (): Promise<LayoutMetadata[]> => {
    return filterMap(
      this.sharedLayoutHistoryByName.values(),
      (history) => history[history.length - 1],
    ).map(({ data: _, ...metadata }) => metadata);
  };

  getCurrentUserLayoutHistory = async (name: string): Promise<LayoutMetadata[]> => {
    return this.currentUserLayoutHistoryByName.get(name) ?? [];
  };

  getSharedLayoutHistory = async (name: string): Promise<LayoutMetadata[]> => {
    return this.sharedLayoutHistoryByName.get(name) ?? [];
  };

  getLayoutByID = async (uid: string): Promise<LayoutRecord | undefined> => {
    return this.layoutsById.get(uid);
  };

  putPrivateLayout = async (layout: Omit<LayoutRecord, "uid">): Promise<void> => {
    const newLayout = { ...layout, uid: uuidv4() };
    getOrSetDefault(this.currentUserLayoutHistoryByName, layout.name, []).push(newLayout);
    this.layoutsById.set(newLayout.uid, newLayout);
  };

  putSharedLayout = async (layout: Omit<LayoutRecord, "uid">): Promise<void> => {
    const newLayout = { ...layout, uid: uuidv4() };
    getOrSetDefault(this.sharedLayoutHistoryByName, layout.name, []).push(newLayout);
    this.layoutsById.set(newLayout.uid, newLayout);
  };
}

export default function MockRemoteLayoutStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const [value] = useState(() => new MockRemoteLayoutStorage());
  return (
    <RemoteLayoutStorageContext.Provider value={value}>
      {children}
    </RemoteLayoutStorageContext.Provider>
  );
}
