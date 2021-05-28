// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { User, AuthCredential } from "@firebase/auth";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useToasts } from "react-toast-notifications";

import AuthContext from "@foxglove/studio-base/context/AuthContext";
import { useFirebase } from "@foxglove/studio-base/context/FirebaseAppContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";
import FirebaseAuth from "@foxglove/studio-base/providers/FirebaseAuth";

type Props = {
  getCredential: () => Promise<AuthCredential>;
};

export default function FirebaseAuthProvider({
  children,
  getCredential,
}: React.PropsWithChildren<Props>): JSX.Element {
  const app = useFirebase();
  const auth = useMemo(() => new FirebaseAuth(app, getCredential), [app, getCredential]);
  const { addToast } = useToasts();

  const [user, setUser] = useState<User | undefined>();
  useLayoutEffect(() => {
    const listener = (newUser: User | undefined, error: Error | undefined) => {
      if (error != undefined) {
        setUser(undefined);
        addToast(error.toString(), { appearance: "error" });
      } else {
        setUser(newUser);
      }
    };
    auth.addAuthStateChangeListener(listener);
  }, [addToast, auth]);

  const login = useCallback(() => auth.login(), [auth]);
  const logout = useCallback(() => auth.logout(), [auth]);
  const loginWithCredential = useCallback((str: string) => auth.loginWithCredential(str), [auth]);

  const currentUser = useMemo(
    () => (user ? { email: user.email ?? undefined, logout } : undefined),
    [user, logout],
  );

  const value = useShallowMemo({
    currentUser,
    login,
    loginWithCredential,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
