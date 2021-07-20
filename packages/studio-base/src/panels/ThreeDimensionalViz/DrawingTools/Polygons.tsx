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

import { DefaultButton, Label, Stack, useTheme } from "@fluentui/react";
import { PolygonBuilder, Polygon } from "regl-worldview";

import ValidatedInput from "@foxglove/studio-base/components/ValidatedInput";
import {
  SValue,
  SLabel,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/styling";
import {
  polygonsToPoints,
  getFormattedString,
  pointsToPolygons,
  getPolygonLineDistances,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/utils/drawToolUtils";
import clipboard from "@foxglove/studio-base/util/clipboard";
import { polygonPointsValidator } from "@foxglove/studio-base/util/validators";

export type Point2D = { x: number; y: number };

type Props = {
  onSetPolygons: (polygons: Polygon[]) => void;
  polygonBuilder: PolygonBuilder;
};

export default function Polygons({ onSetPolygons, polygonBuilder }: Props): JSX.Element {
  const theme = useTheme();
  const polygons: Polygon[] = polygonBuilder.polygons;
  const [polygonPoints, setPolygonPoints] = React.useState<Point2D[][]>(() =>
    polygonsToPoints(polygons),
  );
  function polygonBuilderOnChange() {
    setPolygonPoints(polygonsToPoints(polygons));
  }
  polygonBuilder.onChange = polygonBuilderOnChange;

  return (
    <Stack
      tokens={{
        childrenGap: theme.spacing.s2,
        padding: theme.spacing.s1,
      }}
    >
      <Label styles={{ root: { fontSize: theme.fonts.small.fontSize } }}>
        Start drawing by holding <kbd>ctrl</kbd> and clicking on the 3D panel.
      </Label>
      <ValidatedInput
        value={polygonPoints}
        onChange={(newPolygonPoints) => {
          if (newPolygonPoints) {
            setPolygonPoints(newPolygonPoints as Point2D[][]);
            onSetPolygons(pointsToPolygons(newPolygonPoints as Point2D[][]));
          }
        }}
        dataValidator={polygonPointsValidator}
      />
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        tokens={{ padding: `${theme.spacing.s2} 0 0 0` }}
      >
        <Stack horizontal verticalAlign="center">
          <SLabel>Total length:</SLabel>
          <SValue>{getPolygonLineDistances(polygonPoints).toFixed(2)} m</SValue>
        </Stack>
        <DefaultButton
          onClick={() => {
            void clipboard.copy(getFormattedString(polygonPoints));
          }}
          styles={{
            label: {
              fontSize: theme.fonts.small.fontSize,
            },
            root: {
              height: "auto",
              padding: theme.spacing.s2,
              minWidth: "64px",
              margin: 0,
              borderRadius: theme.effects.roundedCorner2,
            },
          }}
        >
          Copy JSON
        </DefaultButton>
      </Stack>
    </Stack>
  );
}
