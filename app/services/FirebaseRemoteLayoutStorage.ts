// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FirebaseApp } from "@firebase/app";
import {
  where,
  collection,
  query,
  doc,
  getDocs,
  FirebaseFirestore,
  runTransaction,
  getFirestore,
} from "@firebase/firestore";

import { Auth } from "@foxglove/studio-base/context/AuthContext";
import { RemoteLayoutStorage } from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import { LayoutMetadata, LayoutRecord } from "@foxglove/studio-base/types/storage";

export default class FirebaseRemoteLayoutStorage implements RemoteLayoutStorage {
  private db: FirebaseFirestore;
  private auth: Auth;

  // auth is passed in separately so we can get the hydrated CurrentUser rather than just the Firebase User object
  constructor(app: FirebaseApp, auth: Auth) {
    this.db = getFirestore(app);
    this.auth = auth;
  }

  getCurrentUserLayouts = async (): Promise<LayoutMetadata[]> => {
    if (this.auth.currentUser == undefined) {
      throw new Error("Log in to get layouts");
    }
    const q = query(collection(this.db, `users/${this.auth.currentUser.uid}/layouts`));
    const snapshot = await getDocs(q);
    const results: LayoutMetadata[] = [];
    snapshot.forEach((document) => {
      results.push(document.data() as LayoutMetadata);
    });
    return results;
  };

  getSharedLayouts = async (): Promise<LayoutMetadata[]> => {
    if (this.auth.currentUser == undefined) {
      throw new Error("Log in to view shared layouts");
    }
    if (this.auth.currentUser.teamId == undefined) {
      throw new Error("Create a team to view shared layouts");
    }
    const q = query(collection(this.db, `teams/${this.auth.currentUser.teamId}/layouts`));
    const snapshot = await getDocs(q);
    const results: LayoutMetadata[] = [];
    snapshot.forEach((document) => {
      results.push(document.data() as LayoutMetadata);
    });
    return results;
  };

  getLayoutHistory = async (layoutName: string): Promise<LayoutMetadata[]> => {
    if (this.auth.currentUser == undefined) {
      throw new Error("Log in to view layout history");
    }
    const q = query(
      collection(this.db, `layouts`),
      where("creator_uid", "==", this.auth.currentUser.uid),
      where("name", "==", layoutName),
    );
    const snapshot = await getDocs(q);
    const results: LayoutMetadata[] = [];
    snapshot.forEach((document) => {
      results.push(document.data() as LayoutMetadata);
    });
    return results;
  };

  getLayoutByID = async (layoutID: string): Promise<LayoutRecord[]> => {
    if (this.auth.currentUser == undefined) {
      throw new Error("Log in to fetch layouts");
    }
    const q = query(collection(this.db, "layouts"), where("uid", "==", layoutID));
    const snapshot = await getDocs(q);
    const results: LayoutRecord[] = [];
    snapshot.forEach((document) => {
      results.push(document.data() as LayoutRecord);
    });
    return results;
  };

  putPrivateLayout = async (layout: LayoutRecord): Promise<void> => {
    await runTransaction(this.db, async (tx) => {
      if (this.auth.currentUser == undefined) {
        throw new Error("Log in to upload layouts");
      }
      const userDocRef = doc(this.db, `users/${this.auth.currentUser.uid}/layouts`, layout.name);
      const globalDocRef = doc(this.db, "layouts", "uuid");
      tx.set(userDocRef, {
        name: layout.name,
        creatorUid: this.auth.currentUser.uid,
        createdAt: layout.createdAt,
      });
      tx.set(globalDocRef, layout);
      return;
    });
  };

  putSharedLayout = async (layout: LayoutRecord): Promise<void> => {
    await runTransaction(this.db, async (tx) => {
      if (this.auth.currentUser == undefined) {
        throw new Error("Log in to upload layouts");
      }
      if (this.auth.currentUser.teamId == undefined) {
        throw new Error("Create a team to share layouts");
      }
      const teamDocRef = doc(this.db, `teams/${this.auth.currentUser.teamId}/layouts`);
      const globalDocRef = doc(this.db, "layouts", "uuid");
      tx.set(teamDocRef, {
        name: layout.name,
        creatorUid: this.auth.currentUser.uid,
        createdAt: layout.createdAt,
      });
      tx.set(globalDocRef, layout);
      return;
    });
  };
}
