// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { FirebaseApp } from "@firebase/app";
import {
  User,
  Unsubscribe,
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithCredential,
  OAuthCredential,
  AuthCredential,
} from "@firebase/auth";
import { runTransaction, doc, FirebaseFirestore, getFirestore } from "firebase/firestore";

import { Auth, CurrentUser } from "@foxglove/studio-base";
import { UserRecord } from "@foxglove/studio-base/types/storage"; //FIXME: how to organize these types?

type UserChangeListener = (user: CurrentUser | undefined, error: Error | undefined) => void;

export default class FirebaseAuth implements Auth {
  private userChangeListeners = new Set<UserChangeListener>();
  private unsubscribe: Unsubscribe;
  private app: FirebaseApp;
  private db: FirebaseFirestore;
  private getCredential: () => Promise<AuthCredential>;

  currentUser?: CurrentUser = undefined;

  constructor(app: FirebaseApp, getCredential: () => Promise<AuthCredential>) {
    this.app = app;
    this.db = getFirestore(app);
    this.getCredential = getCredential;
    this.unsubscribe = onAuthStateChanged(
      getAuth(app),
      (newUser) => {
        this.updateCurrentUser(newUser ?? undefined);
      },
      (err) => {
        this.currentUserUpdate?.abort();
        for (const listener of [...this.userChangeListeners]) {
          listener(undefined, err);
        }
      },
    );
  }

  private currentUserUpdate?: AbortController;
  /**
   * Given the new Firebase user, fetch the team id and build the Studio CurrentUser object, then
   * send it to listeners.
   */
  private updateCurrentUser(newUser: User | undefined) {
    this.currentUserUpdate?.abort();

    const controller = new AbortController();
    this.currentUserUpdate = controller;
    this.getTeamId(newUser)
      .then((teamId) => {
        if (controller.signal.aborted) {
          return;
        }
        let currentUser: CurrentUser | undefined;
        if (newUser) {
          currentUser = {
            email: newUser.email ?? undefined,
            uid: newUser.uid,
            teamId,
          };
        }
        this.currentUser = currentUser;
        for (const listener of [...this.userChangeListeners]) {
          listener(currentUser, undefined);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) {
          return;
        }
        for (const listener of [...this.userChangeListeners]) {
          listener(undefined, err);
        }
      });
  }

  private getTeamId = async (_user: User | undefined): Promise<string | undefined> => {
    //FIXME
    throw new Error("fixme");
  };

  destroy = (): void => {
    this.unsubscribe();
  };

  addAuthStateChangeListener = (listener: UserChangeListener): void => {
    this.userChangeListeners.add(listener);
  };

  removeAuthStateChangeListener = (listener: UserChangeListener): void => {
    this.userChangeListeners.delete(listener);
  };

  loginWithCredential = async (credentialStr: string): Promise<void> => {
    const authCredential: AuthCredential = JSON.parse(credentialStr);
    if (authCredential.providerId !== "google.com" /* ProviderId.GOOGLE */) {
      throw Error("Login failed: unsupported credential provider.");
    }
    const oauthCredential = OAuthCredential.fromJSON(authCredential);
    if (!oauthCredential) {
      throw Error("Login failed: invalid credential data.");
    }
    await signInWithCredential(getAuth(this.app), oauthCredential);
  };

  login = async (): Promise<void> => {
    const credential = await this.getCredential();
    return this.loginWithCredential(JSON.stringify(credential.toJSON()));
  };

  logout = async (): Promise<void> => {
    await signOut(getAuth(this.app));
  };

  addUserToTeam = async (record: UserRecord, teamID: string): Promise<void> => {
    const userDocRef = doc(this.db, "users", record.uid);
    const teamDocRef = doc(this.db, "teams", teamID);
    await runTransaction(this.db, async (tx) => {
      // if the team does not exist, reject. If it does exist, ensure the
      // list of user IDs includes the record's ID. TODO: need a trusted
      // UID here.
      const teamDoc = await tx.get(teamDocRef);
      if (!teamDoc.exists()) {
        throw Error("Team does not exist");
      }

      const userIds = teamDoc.data().userIds as string[];
      if (!userIds.includes(record.uid)) {
        userIds.push(record.uid);
        tx.update(teamDocRef, { userIds: userIds });
      }

      const userDoc = await tx.get(userDocRef);

      // If the user exists already, update their existing list of teams.
      // Else insert the entire record.
      if (userDoc.exists()) {
        const teams = userDoc.data().teamIds as string[];
        if (!teams.includes(teamID)) {
          teams.push(teamID);
          tx.update(userDocRef, { teams: teams });
        }
      } else {
        if (!record.teamIds.includes(teamID)) {
          record.teamIds.push(teamID);
        }
        tx.set(userDocRef, record);
      }
    });
  };

  removeUserFromTeam = async (userID: string, teamID: string): Promise<void> => {
    const teamDocRef = doc(this.db, "teams", teamID);
    const userDocRef = doc(this.db, "users", userID);

    await runTransaction(this.db, async (tx) => {
      const teamDoc = await tx.get(teamDocRef);
      if (!teamDoc.exists()) {
        throw Error("Team does not exist");
      }
      const userIDs = teamDoc.data().userIds as string[];
      if (!userIDs.includes(userID)) {
        throw Error("User is not a member");
      }
      tx.update(teamDocRef, { userIds: userIDs.filter((x) => x !== userID) });

      const userDoc = await tx.get(userDocRef);
      if (!userDoc.exists()) {
        throw Error("User does not exist");
      }
      const teamIDs = userDoc.data().teamIds as string[];
      if (!teamIDs.includes(teamID)) {
        throw Error("User is not a member");
      }
      tx.update(userDocRef, { teamIds: teamIDs.filter((x) => x !== teamID) });
    });
  };
}
