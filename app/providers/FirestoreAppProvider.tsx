// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FirebaseFirestore, getFirestore, useFirestoreEmulator } from "@firebase/firestore";
import { useLayoutEffect, useState, useMemo } from "react";

import Logger from "@foxglove/log";
import FirestoreAppContext from "@foxglove/studio-base/context/FirestoreAppContext";

const log = Logger.getLogger(__filename);

/** Initialize a Firebase app from the given config object. */
export default function FirestoreDBProvider({
  emulated,
  children,
}: React.PropsWithChildren<{ emulated: boolean }>): JSX.Element | ReactNull {
  const firestoreDB = useMemo(() => {
    const db = getFirestore();
    if (emulated) {
      useFirestoreEmulator(db, "localhost", 8081);
    }
    return db;
  }, [emulated]);
  return (
    <FirestoreAppContext.Provider value={firestoreDB}>{children}</FirestoreAppContext.Provider>
  );
}
