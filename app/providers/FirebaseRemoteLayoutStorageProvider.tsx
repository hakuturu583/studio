// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { useAuth } from "@foxglove/studio-base/context/AuthContext";
import { useFirebase } from "@foxglove/studio-base/context/FirebaseAppContext";
import RemoteLayoutStorageContext, {
  RemoteLayoutStorage,
} from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import FirebaseRemoteLayoutStorage from "@foxglove/studio-base/services/FirebaseRemoteLayoutStorage";

export default function FirebaseRemoteLayoutStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const app = useFirebase();
  const auth = useAuth();
  const value: RemoteLayoutStorage = useMemo(
    () => new FirebaseRemoteLayoutStorage(app, auth),
    [app, auth],
  );

  return (
    <RemoteLayoutStorageContext.Provider value={value}>
      {children}
    </RemoteLayoutStorageContext.Provider>
  );
}
