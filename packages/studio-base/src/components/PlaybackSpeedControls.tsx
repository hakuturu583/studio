// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2019-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { DefaultButton, IContextualMenuItem, useTheme } from "@fluentui/react";
import { useCallback, useEffect } from "react";

import { useDataSourceInfo } from "@foxglove/studio-base/PanelAPI";
import { useMessagePipeline } from "@foxglove/studio-base/components/MessagePipeline";
import {
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { PlayerCapabilities } from "@foxglove/studio-base/players/types";

const SPEEDS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 0.8, 1, 2, 3, 5];

export default function PlaybackSpeedControls(): JSX.Element {
  const theme = useTheme();
  const configSpeed =
    useCurrentLayoutSelector((state) => state.selectedLayout?.data.playbackConfig.speed) ?? 1;
  const { capabilities } = useDataSourceInfo();
  const canSetSpeed = capabilities.includes(PlayerCapabilities.setSpeed);
  const setPlaybackSpeed = useMessagePipeline(
    useCallback(({ setPlaybackSpeed: pipelineSetPlaybackSpeed }) => pipelineSetPlaybackSpeed, []),
  );
  const { setPlaybackConfig } = useCurrentLayoutActions();
  const setSpeed = useCallback(
    (newSpeed: number) => {
      setPlaybackConfig({ speed: newSpeed });
      if (canSetSpeed) {
        setPlaybackSpeed(newSpeed);
      }
    },
    [canSetSpeed, setPlaybackConfig, setPlaybackSpeed],
  );

  // Set the speed to the speed that we got from the config whenever we get a new Player.
  useEffect(() => {
    if (configSpeed != undefined) {
      setSpeed(configSpeed);
    }
  }, [configSpeed, setSpeed]);

  const displaySpeed = (val: number) => (val < 0.1 ? val?.toFixed(2) : val);

  return (
    <DefaultButton
      menuProps={{
        calloutProps: {
          calloutMaxWidth: 80,
        },
        gapSpace: 6,
        items: SPEEDS.map(
          (s: number): IContextualMenuItem => ({
            canCheck: true,
            key: `${s}`,
            text: `${displaySpeed(s)}`,
            isChecked: configSpeed === s,
            onClick: () => setSpeed(s),
          }),
        ),
      }}
      styles={{
        root: {
          background: theme.semanticColors.buttonBackgroundHovered,
          border: "none",
          padding: theme.spacing.s1,
          margin: 0, // Remove this once global.scss has gone away
          minWidth: "50px",
        },
        rootHovered: {
          background: theme.semanticColors.buttonBackgroundPressed,
        },
        label: theme.fonts.small,
        menuIcon: {
          fontSize: theme.fonts.tiny.fontSize,
        },
      }}
    >
      {`${displaySpeed(configSpeed)}x` ?? "–"}
    </DefaultButton>
  );
}
