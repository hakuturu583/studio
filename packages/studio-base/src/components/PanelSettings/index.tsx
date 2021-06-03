// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { DefaultButton, Stack, Text, useTheme } from "@fluentui/react";
import { StrictMode, useMemo, useState } from "react";
import { useUnmount } from "react-use";

import { useConfigById } from "@foxglove/studio-base/PanelAPI";
import ShareJsonModal from "@foxglove/studio-base/components/ShareJsonModal";
import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import {
  useCurrentLayoutActions,
  useSelectedPanels,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { usePanelCatalog } from "@foxglove/studio-base/context/PanelCatalogContext";
import { PanelIdContext } from "@foxglove/studio-base/context/PanelIdContext";
import { TAB_PANEL_TYPE } from "@foxglove/studio-base/util/globalConstants";
import { getPanelTypeFromId } from "@foxglove/studio-base/util/layout";

import SchemaEditor from "./SchemaEditor";

export default function PanelSettings(): JSX.Element {
  const { selectedPanelIds, setSelectedPanelIds } = useSelectedPanels();
  const selectedPanelId = useMemo(
    () => (selectedPanelIds.length === 1 ? selectedPanelIds[0] : undefined),
    [selectedPanelIds],
  );
  useUnmount(() => {
    // Automatically deselect the panel we were editing when the settings sidebar closes
    if (selectedPanelId != undefined) {
      setSelectedPanelIds([]);
    }
  });

  const theme = useTheme();
  const panelCatalog = usePanelCatalog();
  const { getCurrentLayout, savePanelConfigs } = useCurrentLayoutActions();
  const panelType = useMemo(
    () => (selectedPanelId != undefined ? getPanelTypeFromId(selectedPanelId) : undefined),
    [selectedPanelId],
  );
  const panelInfo = useMemo(
    () => (panelType != undefined ? panelCatalog.getPanelByType(panelType) : undefined),
    [panelCatalog, panelType],
  );

  const [showShareModal, setShowShareModal] = useState(false);
  const shareModal = useMemo(() => {
    if (selectedPanelId == undefined || !showShareModal) {
      return ReactNull;
    }
    const panelConfigById = getCurrentLayout().configById;
    return (
      <ShareJsonModal
        onRequestClose={() => setShowShareModal(false)}
        value={panelConfigById[selectedPanelId] ?? {}}
        onChange={(config) =>
          savePanelConfigs({ configs: [{ id: selectedPanelId, config, override: true }] })
        }
        noun="panel configuration"
      />
    );
  }, [selectedPanelId, showShareModal, getCurrentLayout, savePanelConfigs]);

  const [config, saveConfig] = useConfigById<Record<string, unknown>>(
    selectedPanelId,
    panelInfo?.component.defaultConfig,
  );

  if (selectedPanelId == undefined) {
    return (
      <SidebarContent title={`Panel Settings`}>
        <Text styles={{ root: { color: theme.palette.neutralTertiary } }}>
          Select a panel to edit its settings.
        </Text>
      </SidebarContent>
    );
  }
  if (!panelInfo) {
    throw new Error(
      `Attempt to render settings but no panel component could be found for panel id ${selectedPanelId}`,
    );
  }

  return (
    <SidebarContent title={`${panelInfo.title} Panel Settings`}>
      {shareModal}
      <Stack tokens={{ childrenGap: theme.spacing.m }}>
        <Stack.Item>
          {panelInfo.component.configSchema ? (
            <StrictMode>
              <PanelIdContext.Provider value={selectedPanelId}>
                <SchemaEditor
                  configSchema={panelInfo.component.configSchema}
                  config={config}
                  saveConfig={saveConfig}
                />
              </PanelIdContext.Provider>
            </StrictMode>
          ) : (
            <Text styles={{ root: { color: theme.palette.neutralTertiary } }}>
              No additional settings available.
            </Text>
          )}
        </Stack.Item>
        <div style={{ height: theme.spacing.m }} />
        <Stack.Item>
          <DefaultButton
            text="Import/export settings…"
            styles={{ label: { fontWeight: "normal" } }}
            iconProps={{
              iconName: "CodeEdit",
              styles: { root: { "& span": { verticalAlign: "baseline" } } },
            }}
            onClick={() => setShowShareModal(true)}
            disabled={panelType === TAB_PANEL_TYPE}
          />
        </Stack.Item>
        <Stack.Item>
          <DefaultButton
            text="Reset to defaults"
            styles={{ label: { fontWeight: "normal" } }}
            iconProps={{
              iconName: "ClearSelection",
              styles: { root: { "& span": { verticalAlign: "baseline" } } },
            }}
            onClick={() =>
              savePanelConfigs({
                configs: [{ id: selectedPanelId, config: {}, override: true }],
              })
            }
          />
        </Stack.Item>
      </Stack>
    </SidebarContent>
  );
}
