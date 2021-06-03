// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import type { FirebaseOptions } from "@firebase/app";
import { initializeApp } from "@firebase/app";
import { AuthCredential } from "@firebase/auth";
import { getFirestore, useFirestoreEmulator } from "@firebase/firestore";

import FirebaseAuth from "../services/FirebaseAuth";
import FirebaseRemoteLayoutStorage from "../services/FirebaseRemoteLayoutStorage";

async function login(): Promise<AuthCredential> {
  throw new Error();
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
    useFirestoreEmulator(getFirestore(app), "localhost", 8081);
    const auth = new FirebaseAuth(app, login);
    const storage = new FirebaseRemoteLayoutStorage(app, auth);
    storage.getCurrentUserLayouts();
  });
});
