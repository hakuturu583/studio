// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.
import MagnifyIcon from "@mdi/svg/svg/magnify.svg";
import fuzzySort from "fuzzysort";
import { useEffect, useMemo } from "react";
import { useDrag } from "react-dnd";
import { MosaicDragType, MosaicPath } from "react-mosaic-component";
import styled from "styled-components";

import Flex from "@foxglove/studio-base/components/Flex";
import Icon from "@foxglove/studio-base/components/Icon";
import { Item } from "@foxglove/studio-base/components/Menu";
import TextHighlight from "@foxglove/studio-base/components/TextHighlight";
import {
  useCurrentLayoutActions,
  usePanelMosaicId,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PanelInfo, usePanelCatalog } from "@foxglove/studio-base/context/PanelCatalogContext";
import { TabPanelConfig } from "@foxglove/studio-base/types/layouts";
import {
  PanelConfig,
  MosaicDropTargetPosition,
  SavedProps,
  MosaicDropResult,
} from "@foxglove/studio-base/types/panels";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

import styles from "./index.module.scss";

const StickyDiv = styled.div`
  color: ${colors.LIGHT};
  position: sticky;
  top: 0;
  z-index: 2;
`;

const SSearchInputContainer = styled(Flex)`
  padding-left: 8px;
  background-color: ${colors.DARK5};
  border-radius: 4px;
`;

const SSearchInput = styled.input`
  background-color: ${colors.DARK5};
  padding: 8px;
  width: 100%;
  min-width: 0;
  margin: 0;

  &:hover,
  &:focus {
    background-color: ${colors.DARK5};
  }
`;

const SScrollContainer = styled.div`
  overflow-y: auto;
  height: 100%;
`;

const SEmptyState = styled.div`
  padding: 0px 16px 16px;
  opacity: 0.4;
`;

type PresetSettings =
  | { config: TabPanelConfig; relatedConfigs: SavedProps }
  | { config: PanelConfig; relatedConfigs: typeof undefined };

export type PanelListItem = {
  title: string;
  component: React.ComponentType<any>;
  presetSettings?: PresetSettings;
};

type DropDescription = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: SavedProps;
  position?: MosaicDropTargetPosition;
  path?: MosaicPath;
  tabId?: string;
};
type PanelItemProps = {
  panel: {
    type: string;
    title: string;
    config?: PanelConfig;
    relatedConfigs?: SavedProps;
  };
  searchQuery: string;
  checked?: boolean;
  highlighted?: boolean;
  onClick: () => void;
  mosaicId: string;
  onDrop: (arg0: DropDescription) => void;
};

function DraggablePanelItem({
  searchQuery,
  panel,
  onClick,
  onDrop,
  checked,
  highlighted,
  mosaicId,
}: PanelItemProps) {
  const scrollRef = React.useRef<HTMLDivElement>(ReactNull);
  const [, drag] = useDrag<unknown, MosaicDropResult, never>({
    type: MosaicDragType.WINDOW,
    // mosaicId is needed for react-mosaic to accept the drop
    item: () => ({ mosaicId }),
    options: { dropEffect: "copy" },
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult() ?? {};
      const { position, path, tabId } = dropResult;
      // dropping outside mosaic does nothing. If we have a tabId, but no
      // position or path, we're dragging into an empty tab.
      if ((position == undefined || path == undefined) && tabId == undefined) {
        return;
      }
      const { type, config, relatedConfigs } = panel;
      onDrop({ type, config, relatedConfigs, position, path, tabId });
    },
  });

  React.useEffect(() => {
    if (highlighted === true && scrollRef.current) {
      const highlightedItem = scrollRef.current.getBoundingClientRect();
      const scrollContainer = scrollRef.current.parentElement?.parentElement?.parentElement;
      if (scrollContainer) {
        const scrollContainerToTop = scrollContainer.getBoundingClientRect().top;

        const isInView =
          highlightedItem.top >= 0 &&
          highlightedItem.top >= scrollContainerToTop &&
          highlightedItem.top + 50 <= window.innerHeight;

        if (!isInView) {
          scrollRef.current?.scrollIntoView();
        }
      }
    }
  }, [highlighted]);

  return (
    <div ref={drag}>
      <div ref={scrollRef}>
        <Item
          onClick={onClick}
          checked={checked}
          highlighted={highlighted}
          className={styles.item}
          dataTest={`panel-menu-item ${panel.title}`}
        >
          <TextHighlight targetStr={panel.title} searchText={searchQuery} />
        </Item>
      </div>
    </div>
  );
}

export type PanelSelection = {
  type: string;
  config?: PanelConfig;
  relatedConfigs?: {
    [panelId: string]: PanelConfig;
  };
};
type Props = {
  onPanelSelect: (arg0: PanelSelection) => void;
  selectedPanelTitle?: string;
};

// sanity checks to help panel authors debug issues
function verifyPanels(panels: PanelInfo[]) {
  const panelTypes: Map<
    string,
    { component: React.ComponentType<any>; presetSettings?: PresetSettings }
  > = new Map();
  for (const { component } of panels) {
    const { name, displayName, panelType } = component;
    const dispName = displayName ?? name ?? "<unnamed>";
    if (panelType.length === 0) {
      throw new Error(`Panel component ${dispName} must declare a unique \`static panelType\``);
    }
    const existingPanel = panelTypes.get(panelType);
    if (existingPanel) {
      const otherDisplayName =
        existingPanel.component.displayName ?? existingPanel.component.name ?? "<unnamed>";
      throw new Error(
        `Two components have the same panelType ('${panelType}'): ${otherDisplayName} and ${dispName}`,
      );
    }
    panelTypes.set(panelType, { component });
  }
}

function PanelList(props: Props): JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedPanelIdx, setHighlightedPanelIdx] = React.useState<number | undefined>();
  const { onPanelSelect, selectedPanelTitle } = props;

  const { dropPanel } = useCurrentLayoutActions();
  const mosaicId = usePanelMosaicId();

  // Update panel layout when a panel menu item is dropped;
  // actual operations to change layout supplied by react-mosaic-component
  const onPanelMenuItemDrop = React.useCallback(
    ({ config, relatedConfigs, type, position, path, tabId }: DropDescription) => {
      dropPanel({
        newPanelType: type,
        destinationPath: path,
        position,
        tabId,
        config,
        relatedConfigs,
      });
    },
    [dropPanel],
  );

  const handleSearchChange = React.useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    // TODO(Audrey): press enter to select the first item, allow using arrow key to go up and down
    setSearchQuery((e.target as any).value);
    setHighlightedPanelIdx(0);
  }, []);

  const panelCatalog = usePanelCatalog();
  const allPanels = useMemo(() => {
    return panelCatalog.getPanels();
  }, [panelCatalog]);
  /*
  const panelsByCategory = useMemo(() => {
    const allPanels = panelCatalog.getPanels();
    const panelsByCat = new Map<string, PanelInfo[]>();

    for (const panel of allPanels) {
      const existing = panelsByCat.get(panel.category ?? "misc") ?? [];
      existing.push(panel);
      panelsByCat.set(panel.category ?? "misc", existing);
    }
    return panelsByCat;
  }, [panelCatalog]);
  */

  //const panelCategories = useMemo(() => Array.from(panelsByCategory.keys()), [panelsByCategory]);

  useEffect(() => {
    verifyPanels(allPanels);
  }, [allPanels]);

  /*
  const filteredItemsByCategoryIdx = React.useMemo(
    () => panelCategories.map((category) => getFilteredItemsForCategory(category)),
    [getFilteredItemsForCategory, panelCategories],
  );
  */

  /*
  const noResults = React.useMemo(
    () => filteredItemsByCategoryIdx.every((items) => !items || items.length === 0),
    [filteredItemsByCategoryIdx],
  );
  */

  const filteredPanels = React.useMemo(() => {
    return searchQuery.length > 0
      ? fuzzySort
          .go(searchQuery, allPanels, { key: "title" })
          .map((searchResult) => searchResult.obj)
      : allPanels;
  }, [allPanels, searchQuery]);

  const highlightedPanel = React.useMemo(
    () => (highlightedPanelIdx != undefined ? filteredPanels[highlightedPanelIdx] : undefined),
    [filteredPanels, highlightedPanelIdx],
  );

  const noResults = filteredPanels.length === 0;

  const onKeyDown = React.useCallback(
    (e) => {
      if (e.key === "ArrowDown" && highlightedPanelIdx != undefined) {
        setHighlightedPanelIdx((highlightedPanelIdx + 1) % filteredPanels.length);
      } else if (e.key === "ArrowUp" && highlightedPanelIdx != undefined) {
        const newIdx = (highlightedPanelIdx - 1) % (filteredPanels.length - 1);
        setHighlightedPanelIdx(newIdx >= 0 ? newIdx : filteredPanels.length + newIdx);
      } else if (e.key === "Enter" && highlightedPanel) {
        const { component } = highlightedPanel;
        onPanelSelect({
          type: component.panelType,
        });
      }
    },
    [filteredPanels.length, highlightedPanel, highlightedPanelIdx, onPanelSelect],
  );

  const displayPanelListItem = React.useCallback(
    ({ presetSettings, title, component: { panelType } }) => {
      return (
        <DraggablePanelItem
          key={`${panelType}-${title}`}
          mosaicId={mosaicId}
          panel={{
            type: panelType,
            title,
            config: presetSettings?.config,
            relatedConfigs: presetSettings?.relatedConfigs,
          }}
          onDrop={onPanelMenuItemDrop}
          onClick={() =>
            onPanelSelect({
              type: panelType,
              config: presetSettings?.config,
              relatedConfigs: presetSettings?.relatedConfigs,
            })
          }
          checked={title === selectedPanelTitle}
          highlighted={highlightedPanel?.title === title}
          searchQuery={searchQuery}
        />
      );
    },
    [
      highlightedPanel,
      mosaicId,
      onPanelMenuItemDrop,
      onPanelSelect,
      searchQuery,
      selectedPanelTitle,
    ],
  );

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <StickyDiv>
        <div style={{ padding: "16px" }}>
          <SSearchInputContainer center>
            <Icon style={{ color: colors.LIGHT, opacity: 0.3 }}>
              <MagnifyIcon />
            </Icon>
            <SSearchInput
              placeholder="Search panels"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={onKeyDown}
              onBlur={() => setHighlightedPanelIdx(undefined)}
              onFocus={() => setHighlightedPanelIdx(0)}
              autoFocus
            />
          </SSearchInputContainer>
        </div>
      </StickyDiv>
      <SScrollContainer>
        {noResults && <SEmptyState>No panels match search criteria.</SEmptyState>}
        {filteredPanels.map(displayPanelListItem)}
      </SScrollContainer>
    </div>
  );
}

export default PanelList;
