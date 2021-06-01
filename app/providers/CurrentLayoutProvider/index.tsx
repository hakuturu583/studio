// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { isEqual } from "lodash";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useToasts } from "react-toast-notifications";
import { useAsync, useThrottle } from "react-use";
import { v4 as uuidv4 } from "uuid";

import CurrentLayoutContext from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PanelsState } from "@foxglove/studio-base/context/CurrentLayoutContext/actions";
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import { useUserProfileStorage } from "@foxglove/studio-base/context/UserProfileStorageContext";
import welcomeLayout from "@foxglove/studio-base/layouts/welcomeLayout";
import CurrentLayoutState from "@foxglove/studio-base/providers/CurrentLayoutProvider/CurrentLayoutState";

function migrateLegacyLayoutFromLocalStorage() {
  let result: PanelsState | undefined;
  for (const key of ["webvizGlobalState", "studioGlobalState"]) {
    const value = localStorage.getItem(key);
    if (value != undefined) {
      const panels = JSON.parse(value)?.panels;
      if (panels != undefined) {
        result = panels;
      }
    }
    localStorage.removeItem(key);
  }
  return result;
}

/**
 * Once the initial layout has been determined, this component takes care of initializing the
 * CurrentLayoutState and subscribing to changes. This is done in a second step so that the
 * initialization of CurrentLayoutState can be delayed, to avoid undesired entries on the undo/redo
 * stack from a dummy initial state.
 */
function CurrentLayoutProviderWithInitialState({
  initialState,
  children,
}: React.PropsWithChildren<{ initialState: PanelsState }>) {
  const { addToast } = useToasts();

  const { setUserProfile } = useUserProfileStorage();
  const layoutStorage = useLayoutStorage();

  const [stateInstance] = useState(() => new CurrentLayoutState(initialState));
  const [panelsState, setPanelsState] = useState(() => stateInstance.actions.getCurrentLayout());

  const lastCurrentLayoutId = useRef(initialState.id);
  const previousSavedState = useRef<PanelsState | undefined>();

  useLayoutEffect(() => {
    const currentState = stateInstance.actions.getCurrentLayout();
    // Skip initial save to LayoutStorage unless the layout changed since we initialized
    // CurrentLayoutState (e.g. for migrations)
    if (previousSavedState.current == undefined && isEqual(initialState, currentState)) {
      previousSavedState.current = currentState;
    }
    const listener = (state: PanelsState) => {
      // When a new layout is selected, we don't need to save it back to storage
      if (state.id !== previousSavedState.current?.id) {
        previousSavedState.current = state;
      }
      setPanelsState(state);
    };
    stateInstance.addPanelsStateListener(listener);
    return () => stateInstance.removePanelsStateListener(listener);
  }, [initialState, stateInstance]);

  // Save the layout to LayoutStorage.
  // Debounce the panel state to avoid persisting the layout constantly as the user is adjusting it
  const throttledPanelsState = useThrottle(panelsState, 1000 /* 1 second */);
  useEffect(() => {
    if (throttledPanelsState === previousSavedState.current) {
      // Don't save a layout that we just loaded
      return;
    }
    previousSavedState.current = throttledPanelsState;
    if (throttledPanelsState.id == undefined || throttledPanelsState.name == undefined) {
      addToast(`The current layout could not be saved: missing id or name.`, {
        appearance: "error",
        id: "CurrentLayoutProvider.layoutStorage.put",
      });
      return;
    }
    layoutStorage
      .put({
        id: throttledPanelsState.id,
        name: throttledPanelsState.name,
        state: throttledPanelsState,
      })
      .catch((error) => {
        console.error(error);
        addToast(`The current layout could not be saved. ${error.toString()}`, {
          appearance: "error",
          id: "CurrentLayoutProvider.layoutStorage.put",
        });
      });
  }, [addToast, layoutStorage, throttledPanelsState]);

  // Save the selected layout id to the UserProfile.
  useEffect(() => {
    if (panelsState.id === lastCurrentLayoutId.current) {
      return;
    }
    lastCurrentLayoutId.current = panelsState.id;
    setUserProfile({ currentLayoutId: panelsState.id }).catch((error) => {
      console.error(error);
      addToast(`The current layout could not be saved. ${error.toString()}`, {
        appearance: "error",
        id: "CurrentLayoutProvider.setUserProfile",
      });
    });
  }, [setUserProfile, panelsState.id, addToast]);

  return (
    <CurrentLayoutContext.Provider value={stateInstance}>{children}</CurrentLayoutContext.Provider>
  );
}

/**
 * Concrete implementation of CurrentLayoutContext.Provider which handles automatically saving and
 * restoring the current layout from LayoutStorage. Must be rendered inside a LayoutStorage
 * provider.
 */
export default function CurrentLayoutProvider({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element | ReactNull {
  const { addToast } = useToasts();

  const { getUserProfile } = useUserProfileStorage();
  const layoutStorage = useLayoutStorage();
  //FIXME: support for remote layout storage

  const loadInitialState = useAsync(async (): Promise<PanelsState | undefined> => {
    try {
      // If a legacy layout exists in localStorage, prefer that.
      // The CurrentLayoutProviderWithInitialState will handle persisting this into LayoutStorage.
      const legacyLayout = migrateLegacyLayoutFromLocalStorage();
      if (legacyLayout != undefined) {
        legacyLayout.id ??= uuidv4();
        legacyLayout.name ??= "unnamed";
        return legacyLayout;
      }
      // If the user's previously selected layout can be loaded, use it
      const { currentLayoutId } = await getUserProfile();
      if (currentLayoutId != undefined) {
        const layout = await layoutStorage.get(currentLayoutId);
        if (layout?.state) {
          return layout.state;
        }
      }
      // Otherwise try to choose any available layout
      const allLayouts = await layoutStorage.list();
      return allLayouts[0]?.state;
    } catch (error) {
      console.error(error);
      addToast(`The current layout could not be loaded. ${error.toString()}`, {
        appearance: "error",
        id: "CurrentLayoutProvider.load",
      });
    }
    return undefined;
  }, [addToast, getUserProfile, layoutStorage]);

  if (loadInitialState.loading) {
    return ReactNull;
  }

  // If we were unable to determine an available layout to load, just load the welcome layout.
  return (
    <CurrentLayoutProviderWithInitialState initialState={loadInitialState.value ?? welcomeLayout}>
      {children}
    </CurrentLayoutProviderWithInitialState>
  );
}
