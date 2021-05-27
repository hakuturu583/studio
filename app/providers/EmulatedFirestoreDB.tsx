// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { getFirestore, FirebaseFirestore, useFirestoreEmulator } from "@firebase/firestore";

/** Initialize a Firebase app from the given config object. */
export default function EmulatedFirestoreDB(): FirebaseFirestore {
  const db = getFirestore();
  useFirestoreEmulator(db, "localhost", 8081);
  return db;
}
