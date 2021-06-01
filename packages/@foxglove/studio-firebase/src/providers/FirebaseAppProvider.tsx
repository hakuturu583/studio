// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FirebaseApp, initializeApp, deleteApp, FirebaseOptions } from "@firebase/app";
import { useLayoutEffect, useState } from "react";

import Logger from "@foxglove/log";

import { FirebaseAppContext } from "../context/FirebaseAppContext";

const log = Logger.getLogger(__filename);

// eslint-disable-next-line no-restricted-syntax
const ReactNull = null;
type ReactNull = typeof ReactNull;

/** Initialize a Firebase app from the given config object. */
export default function FirebaseAppProvider({
  config,
  children,
}: React.PropsWithChildren<{ config: FirebaseOptions }>): JSX.Element | ReactNull {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | undefined>(undefined);
  useLayoutEffect(() => {
    const app = initializeApp(config);
    // FIXME: enable persistence? https://firebase.google.com/docs/firestore/manage-data/enable-offline#web-v9_1
    // may run into issues with multiple windows
    setFirebaseApp(app);
    return () => {
      // Gracefully tear down the app to avoid errors during hot reloading
      deleteApp(app).catch((err) => log.error("Failed to delete Firebase app:", err));
    };
  }, [config]);
  if (!firebaseApp) {
    return ReactNull;
  }
  return <FirebaseAppContext.Provider value={firebaseApp}>{children}</FirebaseAppContext.Provider>;
}
