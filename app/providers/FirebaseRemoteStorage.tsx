// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import {
  where,
  collection,
  query,
  doc,
  getDocs,
  FirebaseFirestore,
  runTransaction,
} from "@firebase/firestore";
import { useMemo } from "react";
import { useToasts } from "react-toast-notifications";

import { Auth } from "@foxglove/studio-base/context/AuthContext";
import { RemoteLayoutStorage } from "@foxglove/studio-base/context/RemoteLayoutStorageContext";
import { LayoutMetadata, LayoutRecord } from "@foxglove/studio-base/types/storage";

export default function FirebaseRemoteLayoutStorage(
  db: FirebaseFirestore,
  auth: Auth,
): RemoteLayoutStorage {
  const { addToast } = useToasts();
  const value: RemoteLayoutStorage = useMemo(
    () => ({
      getCurrentUserLayouts: async () => {
        if (auth.currentUser === undefined) {
          addToast("Log in to get layouts");
          return [];
        }
        const q = query(collection(db, `users/${auth.currentUser.data.uid}/layouts`));
        try {
          const snapshot = await getDocs(q);
          const results: LayoutMetadata[] = [];
          snapshot.forEach((document) => {
            results.push(document.data() as LayoutMetadata);
          });
          return results;
        } catch (error) {
          addToast(`Error fetching user layouts: ${error}`);
          return [];
        }
      },
      getSharedLayouts: async () => {
        if (auth.currentUser === undefined) {
          addToast("Log in to view shared layouts");
          return [];
        }
        const q = query(collection(db, `teams/${auth.currentUser.currentTeamID()}/layouts`));
        try {
          const snapshot = await getDocs(q);
          const results: LayoutMetadata[] = [];
          snapshot.forEach((document) => {
            results.push(document.data() as LayoutMetadata);
          });
          return results;
        } catch (error) {
          addToast(`Error fetching shared layouts: ${error}`);
          return [];
        }
      },
      getLayoutHistory: async (layoutName: string) => {
        if (auth.currentUser === undefined) {
          addToast("Log in to view layout history");
          return [];
        }
        const q = query(
          collection(db, `layouts`),
          where("creator_uid", "==", auth.currentUser.data.uid),
          where("name", "==", layoutName),
        );
        try {
          const snapshot = await getDocs(q);
          const results: LayoutMetadata[] = [];
          snapshot.forEach((document) => {
            results.push(document.data() as LayoutMetadata);
          });
          return results;
        } catch (error) {
          addToast(`Error fetching layout history: ${error}`);
          return [];
        }
      },
      getLayoutByID: async (layoutID: string) => {
        if (auth.currentUser === undefined) {
          addToast("Log in to fetch layouts");
          return [];
        }
        const q = query(collection(db, "layouts"), where("uid", "==", layoutID));
        try {
          const snapshot = await getDocs(q);
          const results: LayoutRecord[] = [];
          snapshot.forEach((document) => {
            results.push(document.data() as LayoutRecord);
          });
          return results;
        } catch (error) {
          addToast(`Error fetching layout: ${error}`);
          return [];
        }
      },

      putPrivateLayout: async (layout: LayoutRecord) => {
        try {
          await runTransaction(db, async (tx) => {
            if (auth.currentUser === undefined) {
              addToast("Log in to upload layouts");
              return Promise.reject("log in to upload layouts");
            }
            const userDocRef = doc(db, `users/${auth.currentUser.data.uid}/layouts`, layout.name);
            const globalDocRef = doc(db, "layouts", "uuid");
            tx.set(userDocRef, {
              name: layout.name,
              creatorUid: auth.currentUser.data.uid,
              createdAt: layout.createdAt,
            });
            tx.set(globalDocRef, layout);
            return;
          });
        } catch (error) {
          addToast(`Error uploading layout: ${error}`);
          return;
        }
      },

      putSharedLayout: async (layout: LayoutRecord) => {
        try {
          await runTransaction(db, async (tx) => {
            if (auth.currentUser === undefined) {
              addToast("Log in to upload layouts");
              return Promise.reject("log in to upload layouts");
            }
            const teamDocRef = doc(db, `teams/${auth.currentUser.data.teamIds[0]}/layouts`);
            const globalDocRef = doc(db, "layouts", "uuid");
            tx.set(teamDocRef, {
              name: layout.name,
              creatorUid: auth.currentUser.data.uid,
              createdAt: layout.createdAt,
            });
            tx.set(globalDocRef, layout);
            return;
          });
        } catch (error) {
          addToast(`Error uploading layout: ${error}`);
          return;
        }
      },
    }),
    [addToast, auth.currentUser, db],
  );
  return value;
}
