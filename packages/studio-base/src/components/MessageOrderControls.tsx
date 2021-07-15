// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:

import { DefaultButton, TooltipHost, useTheme } from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { useCallback } from "react";

import {
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { defaultPlaybackConfig } from "@foxglove/studio-base/providers/CurrentLayoutProvider/reducers";
import { TimestampMethod } from "@foxglove/studio-base/util/time";

const messageOrderLabel = {
  receiveTime: "Receive time",
  headerStamp: "Header stamp",
};

export default function MessageOrderControls(): JSX.Element {
  const theme = useTheme();
  const tooltipId = useId("messageOrderTooltip");
  const messageOrder = useCurrentLayoutSelector(
    (state) => state.selectedLayout?.data.playbackConfig.messageOrder ?? "receiveTime",
  );
  const { setPlaybackConfig } = useCurrentLayoutActions();

  const setMessageOrder = useCallback(
    (newMessageOrder: TimestampMethod) => {
      setPlaybackConfig({ messageOrder: newMessageOrder });
    },
    [setPlaybackConfig],
  );

  const orderText = messageOrderLabel[messageOrder] ?? defaultPlaybackConfig.messageOrder;

  return (
    <TooltipHost
      calloutProps={{
        styles: {
          // TODO: this needs to be fixed in the theme black is white, white is black
          beak: { backgroundColor: "#fdfdfd" },
          beakCurtain: { backgroundColor: "#fdfdfd" },
        },
      }}
      content={`Order messages by ${orderText.toLowerCase()}`}
      id={tooltipId}
    >
      <DefaultButton
        styles={{
          root: {
            background: theme.semanticColors.buttonBackgroundHovered,
            border: "none",
            minWidth: "100px",
            padding: theme.spacing.s1,
          },
          rootHovered: {
            background: theme.semanticColors.buttonBackgroundPressed,
          },
          label: theme.fonts.small,
          menuIcon: {
            fontSize: theme.fonts.tiny.fontSize,
          },
        }}
        menuProps={{
          gapSpace: 6,
          items: [
            {
              canCheck: true,
              key: "receiveTime",
              text: "Receive time",
              isChecked: messageOrder === "receiveTime",
              onClick: () => setMessageOrder("receiveTime"),
            },
            {
              canCheck: true,
              key: "headerStamp",
              text: "Header stamp",
              isChecked: messageOrder === "headerStamp",
              onClick: () => setMessageOrder("headerStamp"),
            },
          ],
        }}
      >
        {orderText}
      </DefaultButton>
    </TooltipHost>
  );
}
