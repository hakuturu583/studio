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

import { CommandBar, IButtonStyles, Stack, useTheme } from "@fluentui/react";
import CameraControlIcon from "@mdi/svg/svg/camera-control.svg";
import { vec3 } from "gl-matrix";
import { isEqual } from "lodash";
import { CameraState, cameraStateSelectors, Vec3 } from "regl-worldview";

import Button from "@foxglove/studio-base/components/Button";
import ExpandingToolbar, { ToolGroup } from "@foxglove/studio-base/components/ExpandingToolbar";
import Icon from "@foxglove/studio-base/components/Icon";
import { usePanelContext } from "@foxglove/studio-base/components/PanelContext";
import Tooltip, { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import { JsonInput } from "@foxglove/studio-base/components/ValidatedInput";
import {
  SValue,
  SLabel,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/Interactions/styling";
import styles from "@foxglove/studio-base/panels/ThreeDimensionalViz/Layout.module.scss";
import {
  getNewCameraStateOnFollowChange,
  TargetPose,
} from "@foxglove/studio-base/panels/ThreeDimensionalViz/threeDimensionalVizUtils";
import { ThreeDimensionalVizConfig } from "@foxglove/studio-base/panels/ThreeDimensionalViz/types";
import colors from "@foxglove/studio-base/styles/colors.module.scss";
import clipboard from "@foxglove/studio-base/util/clipboard";
import { point2DValidator, cameraStateValidator } from "@foxglove/studio-base/util/validators";

export const CAMERA_TAB_TYPE = "Camera";

const LABEL_WIDTH = 112;
const TEMP_VEC3: vec3 = [0, 0, 0];
const ZERO_VEC3 = Object.freeze([0, 0, 0]) as Readonly<vec3>;
const DEFAULT_CAMERA_INFO_WIDTH = 260;

type CameraStateInfoProps = {
  cameraState: Partial<CameraState>;
  onAlignXYAxis: () => void;
};

export type CameraInfoPropsWithoutCameraState = {
  followOrientation: boolean;
  followTf?: string | false;
  isPlaying?: boolean;
  onAlignXYAxis: () => void;
  onCameraStateChange: (arg0: CameraState) => void;
  showCrosshair?: boolean;
  autoSyncCameraState: boolean;
  defaultSelectedTab?: string;
};

type CameraInfoProps = {
  cameraState: CameraState;
  targetPose?: TargetPose;
} & CameraInfoPropsWithoutCameraState;

function CameraStateInfo({ cameraState, onAlignXYAxis }: CameraStateInfoProps) {
  return (
    <>
      {(Object.keys(cameraState) as (keyof CameraState)[])
        .sort()
        .map((key) => {
          let val: unknown = cameraState[key];
          if (key === "perspective") {
            val = val ? "true" : "false";
          } else if (Array.isArray(val)) {
            val = val.map((x) => x.toFixed(1)).join(", ");
          } else if (typeof val === "number") {
            val = val.toFixed(2);
          }
          return [key, val as string];
        })
        .map(([key, val]) => (
          <Stack horizontal verticalAlign="center" key={key}>
            <SLabel width={LABEL_WIDTH}>{key}:</SLabel> <SValue>{val}</SValue>
            {key === "thetaOffset" && (
              <Button
                onClick={onAlignXYAxis}
                tooltip="Align XY axis by reseting thetaOffset to 0. Will no longer follow orientation."
              >
                RESET
              </Button>
            )}
          </Stack>
        ))}
    </>
  );
}

export default function CameraInfo({
  cameraState,
  targetPose,
  followOrientation,
  followTf,
  isPlaying = false,
  onAlignXYAxis,
  onCameraStateChange,
  showCrosshair = false,
  autoSyncCameraState,
  defaultSelectedTab,
}: CameraInfoProps): JSX.Element {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = React.useState(defaultSelectedTab);
  const { updatePanelConfigs, saveConfig } = usePanelContext();
  const [edit, setEdit] = React.useState<boolean>(false);
  const onEditToggle = React.useCallback(() => setEdit((currVal) => !currVal), []);

  const { target, targetOffset } = cameraState;
  const targetHeading = cameraStateSelectors.targetHeading(cameraState);
  const camPos2D = vec3.add(
    TEMP_VEC3,
    target,
    vec3.rotateZ(TEMP_VEC3, targetOffset, ZERO_VEC3, -targetHeading),
  );
  const camPos2DTrimmed = camPos2D.map((num) => +num.toFixed(2));

  const syncCameraState = () => {
    updatePanelConfigs("3D Panel", (config) => {
      // Transform the camera state by whichever TF or orientation the other panels are following.
      const newCameraState = getNewCameraStateOnFollowChange({
        prevCameraState: cameraState,
        prevTargetPose: targetPose,
        prevFollowTf: followTf,
        prevFollowOrientation: followOrientation,
        newFollowTf: (config as ThreeDimensionalVizConfig).followTf,
        newFollowOrientation: (config as ThreeDimensionalVizConfig).followOrientation,
      });
      return { ...config, cameraState: newCameraState };
    });
  };

  const buttonStyles = {
    label: {
      fontSize: theme.fonts.small.fontSize,
    },
    root: {
      padding: theme.spacing.s2,
      margin: 0,
      borderRadius: theme.effects.roundedCorner2,
    },
  } as Partial<IButtonStyles>;

  // FIXME: Use these tooltips
  const autoSyncTooltip = useTooltip({
    contents: "Automatically sync camera across all 3D panels",
  });
  const editTooltip = useTooltip({
    contents: isPlaying
      ? "Pause player to edit raw camera state object"
      : "Edit raw camera state object",
  });
  const cameraStateTooltip = useTooltip({
    contents: "Copy cameraState",
  });
  const syncTooltip = useTooltip({
    contents: "Sync camera state across all 3D panels",
  });
  return (
    <ExpandingToolbar
      tooltip="Camera"
      icon={
        <Icon style={{ color: autoSyncCameraState ? colors.accent : "white" }}>
          <CameraControlIcon />
        </Icon>
      }
      className={styles.buttons}
      selectedTab={selectedTab}
      onSelectTab={(newSelectedTab) => setSelectedTab(newSelectedTab)}
    >
      <ToolGroup name={CAMERA_TAB_TYPE}>
        <Stack styles={{ root: { minWidth: DEFAULT_CAMERA_INFO_WIDTH } }}>
          <CommandBar
            items={[
              {
                key: "copy",
                text: "Copy",
                onClick: () => {
                  void clipboard.copy(JSON.stringify(cameraState, undefined, 2));
                },
                buttonStyles,
              },
              {
                key: "edit",
                text: edit ? "Done" : "Edit",
                disabled: isPlaying,
                onClick: onEditToggle,
                buttonStyles,
              },
              {
                key: "sync",
                text: "Sync",
                onClick: syncCameraState,
                buttonStyles,
              },
            ]}
            styles={{
              root: {
                padding: theme.spacing.s1,
                height: "auto",
              },
              primarySet: {
                flexDirection: "row-reverse",
                fontSize: theme.fonts.small.fontSize,
              },
            }}
          />
          {edit && !isPlaying ? (
            <div style={{ padding: theme.spacing.s1 }}>
              <JsonInput
                value={cameraState}
                onChange={(newCameraState) => saveConfig({ cameraState: newCameraState })}
                dataValidator={cameraStateValidator}
              />
            </div>
          ) : (
            <Stack tokens={{ padding: theme.spacing.s1 }}>
              <CameraStateInfo cameraState={cameraState} onAlignXYAxis={onAlignXYAxis} />
              <Stack>
                <Stack horizontal verticalAlign="center" style={{ marginBottom: 8 }}>
                  <Tooltip
                    placement="top"
                    contents="Automatically sync camera across all 3D panels"
                  >
                    <SLabel>Auto sync:</SLabel>
                  </Tooltip>
                  <SValue>
                    <input
                      type="checkbox"
                      checked={autoSyncCameraState}
                      onChange={() =>
                        updatePanelConfigs("3D Panel", (config) => ({
                          ...config,
                          cameraState,
                          autoSyncCameraState: !autoSyncCameraState,
                        }))
                      }
                    />
                  </SValue>
                </Stack>
                <Stack horizontal verticalAlign="center" styles={{ root: { marginBottom: 8 } }}>
                  <SLabel style={cameraState.perspective ? { color: colors.textMuted } : {}}>
                    Show crosshair:
                  </SLabel>
                  <SValue>
                    <input
                      type="checkbox"
                      disabled={cameraState.perspective}
                      checked={showCrosshair}
                      onChange={() => saveConfig({ showCrosshair: !showCrosshair })}
                    />
                  </SValue>
                </Stack>
                {showCrosshair && !cameraState.perspective && (
                  <Stack
                    horizontal
                    verticalAlign="center"
                    styles={{ root: { paddingLeft: LABEL_WIDTH, marginBottom: 8 } }}
                  >
                    <SValue>
                      <JsonInput
                        inputStyle={{ width: 140 }}
                        value={{ x: camPos2DTrimmed[0], y: camPos2DTrimmed[1] }}
                        onChange={(data) => {
                          const point = data as { x: number; y: number };
                          const newPos: vec3 = [point.x, point.y, 0];
                          // extract the targetOffset by subtracting from the target and un-rotating by heading
                          const newTargetOffset = vec3.rotateZ(
                            [0, 0, 0],
                            vec3.sub(TEMP_VEC3, newPos, cameraState.target),
                            ZERO_VEC3,
                            cameraStateSelectors.targetHeading(cameraState),
                          ) as Vec3;
                          if (!isEqual(cameraState.targetOffset, newTargetOffset)) {
                            onCameraStateChange({ ...cameraState, targetOffset: newTargetOffset });
                          }
                        }}
                        dataValidator={point2DValidator}
                      />
                    </SValue>
                  </Stack>
                )}
              </Stack>
              {typeof followTf === "string" && followTf.length > 0 ? (
                <Stack horizontal verticalAlign="center">
                  <SLabel>Following frame:</SLabel>
                  <SValue>
                    <code>{followTf}</code>
                    {followOrientation && " with orientation"}
                  </SValue>
                </Stack>
              ) : (
                <p>Locked to map</p>
              )}
            </Stack>
          )}
        </Stack>
      </ToolGroup>
    </ExpandingToolbar>
  );
}
