// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { action } from "@storybook/addon-actions";
import { Story } from "@storybook/react";

import PanelSetup from "@foxglove/studio-base/stories/PanelSetup";

import TeleopPanel from "./index";

export default {
  title: "panels/Teleop/index",
  component: TeleopPanel,
  decorators: [
    (StoryComponent: Story): JSX.Element => {
      return (
        <PanelSetup fixture={{ publish: action("publish") }}>
          <StoryComponent />
        </PanelSetup>
      );
    },
  ],
};

export const EmptyState = (): JSX.Element => {
  return <TeleopPanel />;
};
