// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FirebaseFirestore } from "@firebase/firestore";
import { useMemo } from "react";

import { Auth } from "@foxglove/studio-base/context/AuthContext";
import RemoteLayoutStorageContext, {
  RemoteLayoutStorage,
} from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import FirebaseRemoteLayoutStorage from "@foxglove/studio-base/providers/FirebaseRemoteStorage";

export default function FirebaseRemoteLayoutStorageProvider({
  db,
  auth,
  children,
}: React.PropsWithChildren<{ db: FirebaseFirestore; auth: Auth }>): JSX.Element {
  const value: RemoteLayoutStorage = useMemo(
    () => FirebaseRemoteLayoutStorage(db, auth),
    [db, auth],
  );
  return (
    <RemoteLayoutStorageContext.Provider value={value}>
      {children}
    </RemoteLayoutStorageContext.Provider>
  );
}
