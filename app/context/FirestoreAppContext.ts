// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { FirebaseFirestore } from "firebase/firestore";
import { createContext, useContext } from "react";

const FirestoreAppContext = createContext<FirebaseFirestore | undefined>(undefined);

export function useFirestore(): FirebaseFirestore {
  const ctx = useContext(FirestoreAppContext);
  if (ctx == undefined) {
    throw new Error("A FirestoreAppContext provider is required to useFirestore");
  }
  return ctx;
}

export default FirestoreAppContext;
