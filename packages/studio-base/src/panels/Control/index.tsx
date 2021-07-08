// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ReactDOM from "react-dom";

import { PanelExtensionContext } from "@foxglove/studio";
import Panel from "@foxglove/studio-base/components/Panel";
import PanelExtensionAdapter from "@foxglove/studio-base/components/PanelExtensionAdapter";
import { SaveConfig } from "@foxglove/studio-base/types/panels";

import ControlPanel from "./ControlPanel";
import helpContent from "./index.help.md";

import "leaflet/dist/leaflet.css";

function initPanel(context: PanelExtensionContext) {
  ReactDOM.render(<ControlPanel context={context} />, context.panelElement);
}

type Props = {
  config: unknown;
  saveConfig: SaveConfig<unknown>;
};

function ControlPanelAdapter(props: Props) {
  return (
    <PanelExtensionAdapter
      config={props.config}
      saveConfig={props.saveConfig}
      help={helpContent}
      initPanel={initPanel}
    />
  );
}

ControlPanelAdapter.panelType = "Control";
ControlPanelAdapter.defaultConfig = {};
ControlPanelAdapter.supportsStrictMode = false;

export default Panel(ControlPanelAdapter);