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

import { storiesOf } from "@storybook/react";
import { useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TestUtils from "react-dom/test-utils";

import Panel from "@foxglove/studio-base/components/Panel";
import PanelList from "@foxglove/studio-base/components/PanelList";
import CurrentLayoutContext from "@foxglove/studio-base/context/CurrentLayoutContext";
import PanelCatalogContext, {
  PanelCatalog,
  PanelInfo,
} from "@foxglove/studio-base/context/PanelCatalogContext";
import CurrentLayoutState, {
  DEFAULT_LAYOUT_FOR_TESTS,
} from "@foxglove/studio-base/providers/CurrentLayoutProvider/CurrentLayoutState";

const SamplePanel1 = function () {
  return <div></div>;
};
SamplePanel1.panelType = "sample";
SamplePanel1.defaultConfig = {};

const SamplePanel2 = function () {
  return <div></div>;
};
SamplePanel2.panelType = "sample2";
SamplePanel2.defaultConfig = {};

const MockPanel1 = Panel(SamplePanel1);
const MockPanel2 = Panel(SamplePanel2);

const allPanels = [
  { title: "Some Panel", component: MockPanel1 },
  { title: "Happy Panel", component: MockPanel2 },
];

class MockPanelCatalog implements PanelCatalog {
  getPanels(): PanelInfo[] {
    return allPanels;
  }
  getPanelByType(type: string): PanelInfo | undefined {
    return allPanels.find((panel) => panel.component.panelType === type);
  }
}

const PanelListWithInteractions = ({
  inputValue,
  events = [],
}: {
  inputValue?: string;
  events?: any[];
}) => (
  <div
    style={{ margin: 50, height: 480 }}
    ref={(el) => {
      if (el) {
        const input: HTMLInputElement | undefined = el.querySelector("input") as any;
        if (input) {
          input.focus();
          if (inputValue != undefined) {
            input.value = inputValue;
            TestUtils.Simulate.change(input);
          }
          setTimeout(() => {
            events.forEach((event) => {
              TestUtils.Simulate.keyDown(input, event);
            });
          }, 100);
        }
      }
    }}
  >
    <PanelList
      onPanelSelect={() => {
        // no-op
      }}
    />
  </div>
);

const arrowDown = { key: "ArrowDown", code: "ArrowDown", keyCode: 40 };
const arrowUp = { key: "ArrowUp", code: "ArrowUp", keyCode: 91 };

storiesOf("components/PanelList", module)
  .addParameters({
    chromatic: {
      // Wait for simulated key events
      delay: 100,
    },
  })
  .addDecorator((childrenRenderFcn) => {
    const currentLayout = useMemo(() => new CurrentLayoutState(DEFAULT_LAYOUT_FOR_TESTS), []);
    return (
      <DndProvider backend={HTML5Backend}>
        <PanelCatalogContext.Provider value={new MockPanelCatalog()}>
          <CurrentLayoutContext.Provider value={currentLayout}>
            {childrenRenderFcn()}
          </CurrentLayoutContext.Provider>
        </PanelCatalogContext.Provider>
      </DndProvider>
    );
  })
  .add("panel list", () => (
    <div style={{ margin: 50, height: 480 }}>
      <PanelList
        onPanelSelect={() => {
          // no-op
        }}
      />
    </div>
  ))
  .add("filtered panel list", () => <PanelListWithInteractions inputValue="h" />)
  .add("navigating panel list with arrow keys", () => (
    <PanelListWithInteractions events={[arrowDown, arrowDown, arrowUp]} />
  ))
  .add("navigating up from top of panel list will scroll to highlighted last item", () => (
    <PanelListWithInteractions events={[arrowUp]} />
  ))
  .add("filtered panel list without results in 1st category", () => (
    <PanelListWithInteractions inputValue="Happy" />
  ))
  .add("filtered panel list without results in last category", () => (
    <PanelListWithInteractions inputValue="Some" />
  ))
  .add("filtered panel list without results in any category", () => (
    <PanelListWithInteractions inputValue="zz" />
  ))
  .add("case-insensitive filtering and highlight submenu", () => (
    <PanelListWithInteractions inputValue="hn" />
  ));
