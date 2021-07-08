// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useMemo } from "react";

import { useConsoleApi } from "@foxglove/studio-base/context/ConsoleApiContext";
import { useCurrentUser } from "@foxglove/studio-base/context/CurrentUserContext";
import { useLayoutCache } from "@foxglove/studio-base/context/LayoutCacheContext";
import LayoutStorageContext from "@foxglove/studio-base/context/LayoutStorageContext";
import CacheOnlyLayoutStorage from "@foxglove/studio-base/services/CacheOnlyLayoutStorage";
import ConsoleApiRemoteLayoutStorage from "@foxglove/studio-base/services/ConsoleApiRemoteLayoutStorage";
import OfflineLayoutStorage from "@foxglove/studio-base/services/OfflineLayoutStorage";

export default function ConsoleApiLayoutStorageProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const api = useConsoleApi();
  const currentUser = useCurrentUser();

  const apiStorage = useMemo(() => new ConsoleApiRemoteLayoutStorage(api), [api]);

  const layoutCache = useLayoutCache();
  const cacheOnlyStorage = useMemo(() => new CacheOnlyLayoutStorage(layoutCache), [layoutCache]);

  const offlineStorage = useMemo(
    () => new OfflineLayoutStorage({ cacheStorage: layoutCache, remoteStorage: apiStorage }),
    [layoutCache, apiStorage],
  );

  return (
    <LayoutStorageContext.Provider value={currentUser ? offlineStorage : cacheOnlyStorage}>
      {children}
    </LayoutStorageContext.Provider>
  );
}
