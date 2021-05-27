// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { FirebaseOptions } from "@firebase/app";
import { initializeApp } from "@firebase/app";

import EmulatedFirestoreDB from "@foxglove/studio-base/providers/EmulatedFirestoreDB";
import FirebaseAuth from "@foxglove/studio-base/providers/FirebaseAuth";
import FirebaseRemoteLayoutStorage from "@foxglove/studio-base/providers/FirebaseRemoteStorage";

async function login(): Promise<string> {
  return "";
}

describe("firestore test", () => {
  it("connects to the emulated database", () => {
    const configData = JSON.stringify({
      apiKey: "AIzaSyCNoiuCap8m0BYUde0wiiuP8k1cXmTpKN0",
      authDomain: "foxglove-studio-testing.firebaseapp.com",
      projectId: "foxglove-studio-testing",
      storageBucket: "foxglove-studio-testing.appspot.com",
      messagingSenderId: "667544771216",
      appId: "1:667544771216:web:f8e6d9705a3c28e73a5615",
    });
    const firebaseConfig = JSON.parse(configData) as FirebaseOptions;
    const app = initializeApp(firebaseConfig);
    const db = EmulatedFirestoreDB();
    const auth = FirebaseAuth({ getLoginCredential: login, db: db, app: app });
    const storage = FirebaseRemoteLayoutStorage(db, auth);
    storage.getCurrentUserLayouts();
  });
});
