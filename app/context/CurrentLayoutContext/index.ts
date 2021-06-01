// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useCallback, useLayoutEffect, useReducer, useRef, useState } from "react";
import { getLeaves } from "react-mosaic-component";

import { selectWithUnstableIdentityWarning } from "@foxglove/studio-base/hooks/selectWithUnstableIdentityWarning";
import useGuaranteedContext from "@foxglove/studio-base/hooks/useGuaranteedContext";
import useShallowMemo from "@foxglove/studio-base/hooks/useShallowMemo";
import { LinkedGlobalVariables } from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/useLinkedGlobalVariables";
import toggleSelectedPanel from "@foxglove/studio-base/providers/CurrentLayoutProvider/toggleSelectedPanel";
import { PanelConfig, PlaybackConfig, UserNodes } from "@foxglove/studio-base/types/panels";

import {
  PanelsState,
  AddPanelPayload,
  ChangePanelLayoutPayload,
  ClosePanelPayload,
  CreateTabPanelPayload,
  DropPanelPayload,
  EndDragPayload,
  LoadLayoutPayload,
  MoveTabPayload,
  SaveConfigsPayload,
  SplitPanelPayload,
  StartDragPayload,
  SwapPanelPayload,
} from "./actions";

/**
 * Encapsulates the mosaic layout, user nodes, and playback settings (everything considered to be
 * part of a saved "layout") used by the current workspace.
 */
export interface CurrentLayout {
  addPanelsStateListener: (listener: (_: PanelsState) => void) => void;
  removePanelsStateListener: (listener: (_: PanelsState) => void) => void;
  addSelectedPanelIdsListener: (listener: (_: readonly string[]) => void) => void;
  removeSelectedPanelIdsListener: (listener: (_: readonly string[]) => void) => void;

  /**
   * We use the same mosaicId for all mosaics (at the top level and within tabs) to support
   * dragging and dropping between them.
   */
  mosaicId: string;

  getSelectedPanelIds: () => readonly string[];
  setSelectedPanelIds: (
    _: readonly string[] | ((prevState: readonly string[]) => string[]),
  ) => void;

  actions: {
    /**
     * Returns the current state - useful for click handlers and callbacks that read the state
     * asynchronously and don't want to update every time the state changes.
     */
    getCurrentLayout: () => PanelsState;

    undoLayoutChange: () => void;
    redoLayoutChange: () => void;

    createNewLayout: () => void;

    savePanelConfigs: (payload: SaveConfigsPayload) => void;
    updatePanelConfigs: (panelType: string, updater: (config: PanelConfig) => PanelConfig) => void;
    createTabPanel: (payload: CreateTabPanelPayload) => void;
    changePanelLayout: (payload: ChangePanelLayoutPayload) => void;
    loadLayout: (payload: LoadLayoutPayload) => void;
    overwriteGlobalVariables: (payload: { [key: string]: unknown }) => void;
    setGlobalVariables: (payload: { [key: string]: unknown }) => void;
    setUserNodes: (payload: UserNodes) => void;
    setLinkedGlobalVariables: (payload: LinkedGlobalVariables) => void;
    setPlaybackConfig: (payload: Partial<PlaybackConfig>) => void;
    closePanel: (payload: ClosePanelPayload) => void;
    splitPanel: (payload: SplitPanelPayload) => void;
    swapPanel: (payload: SwapPanelPayload) => void;
    moveTab: (payload: MoveTabPayload) => void;
    addPanel: (payload: AddPanelPayload) => void;
    dropPanel: (payload: DropPanelPayload) => void;
    startDrag: (payload: StartDragPayload) => void;
    endDrag: (payload: EndDragPayload) => void;
  };
}

export type CurrentLayoutActions = CurrentLayout["actions"];

export type SelectedPanelActions = {
  getSelectedPanelIds: () => readonly string[];
  selectedPanelIds: readonly string[];
  setSelectedPanelIds: (
    _: readonly string[] | ((prevState: readonly string[]) => string[]),
  ) => void;
  selectAllPanels: () => void;
  togglePanelSelected: (panelId: string, containingTabId: string | undefined) => void;
};

const CurrentLayoutContext = createContext<CurrentLayout | undefined>(undefined);

export function usePanelMosaicId(): string {
  return useGuaranteedContext(CurrentLayoutContext).mosaicId;
}
export function useCurrentLayoutActions(): CurrentLayoutActions {
  return useGuaranteedContext(CurrentLayoutContext).actions;
}
export function useCurrentLayoutSelector<T>(selector: (panelsState: PanelsState) => T): T {
  const currentLayout = useGuaranteedContext(CurrentLayoutContext);
  const [_, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const state = useRef<{ value: T; selector: typeof selector } | undefined>(undefined);
  if (!state.current || selector !== state.current.selector) {
    state.current = {
      value: selectWithUnstableIdentityWarning(currentLayout.actions.getCurrentLayout(), selector),
      selector,
    };
  }
  useLayoutEffect(() => {
    const listener = (newState: PanelsState) => {
      const newValue = selectWithUnstableIdentityWarning(newState, selector);
      if (newValue !== state.current?.value) {
        forceUpdate();
      }
      state.current = {
        value: newValue,
        selector,
      };
    };
    // Update if necessary, i.e. if the state has changed between render and this effect
    listener(currentLayout.actions.getCurrentLayout());
    currentLayout.addPanelsStateListener(listener);
    return () => currentLayout.removePanelsStateListener(listener);
  }, [currentLayout, selector]);

  return state.current.value;
}
export function useSelectedPanels(): SelectedPanelActions {
  const currentLayout = useGuaranteedContext(CurrentLayoutContext);
  const [selectedPanelIds, setSelectedPanelIdsState] = useState(() =>
    currentLayout.getSelectedPanelIds(),
  );
  useLayoutEffect(() => {
    const listener = (newIds: readonly string[]) => setSelectedPanelIdsState(newIds);
    currentLayout.addSelectedPanelIdsListener(listener);
    return () => currentLayout.removeSelectedPanelIdsListener(listener);
  }, [currentLayout]);

  const setSelectedPanelIds = useGuaranteedContext(CurrentLayoutContext).setSelectedPanelIds;
  const getSelectedPanelIds = useGuaranteedContext(CurrentLayoutContext).getSelectedPanelIds;
  const { getCurrentLayout } = useCurrentLayoutActions();

  const selectAllPanels = useCallback(() => {
    // eslint-disable-next-line no-restricted-syntax
    const panelIds = getLeaves(getCurrentLayout().layout ?? null);
    setSelectedPanelIds(panelIds);
  }, [getCurrentLayout, setSelectedPanelIds]);

  const togglePanelSelected = useCallback(
    (panelId: string, containingTabId: string | undefined) => {
      setSelectedPanelIds((selectedIds) =>
        toggleSelectedPanel(panelId, containingTabId, getCurrentLayout().configById, selectedIds),
      );
    },
    [setSelectedPanelIds, getCurrentLayout],
  );

  return useShallowMemo({
    getSelectedPanelIds,
    selectedPanelIds,
    setSelectedPanelIds,
    selectAllPanels,
    togglePanelSelected,
  });
}

export default CurrentLayoutContext;
