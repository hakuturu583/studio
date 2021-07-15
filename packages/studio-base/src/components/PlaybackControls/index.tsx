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

import { Stack, IconButton, IButtonStyles, useTheme } from "@fluentui/react";
import React, { memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from "uuid";

import { Time, compare } from "@foxglove/rostime";
import { AppSetting } from "@foxglove/studio-base/AppSetting";
import HoverableIconButton from "@foxglove/studio-base/components/HoverableIconButton";
import KeyListener from "@foxglove/studio-base/components/KeyListener";
import MessageOrderControls from "@foxglove/studio-base/components/MessageOrderControls";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@foxglove/studio-base/components/MessagePipeline";
import PlaybackTimeDisplayMethod from "@foxglove/studio-base/components/PlaybackControls/PlaybackTimeDisplayMethod";
import {
  jumpSeek,
  DIRECTION,
} from "@foxglove/studio-base/components/PlaybackControls/sharedHelpers";
import PlaybackSpeedControls from "@foxglove/studio-base/components/PlaybackSpeedControls";
import Slider from "@foxglove/studio-base/components/Slider";
import { useTooltip } from "@foxglove/studio-base/components/Tooltip";
import {
  useClearHoverValue,
  useSetHoverValue,
} from "@foxglove/studio-base/context/HoverValueContext";
import { useAppConfigurationValue } from "@foxglove/studio-base/hooks/useAppConfigurationValue";
import { PlayerState, PlayerStateActiveData } from "@foxglove/studio-base/players/types";
import colors from "@foxglove/studio-base/styles/colors.module.scss";
import { formatTime } from "@foxglove/studio-base/util/formatTime";
import { colors as sharedColors } from "@foxglove/studio-base/util/sharedStyleConstants";
import { subtractTimes, toSec, fromSec, formatTimeRaw } from "@foxglove/studio-base/util/time";

import PlaybackBarHoverTicks from "./PlaybackBarHoverTicks";
import { ProgressPlot } from "./ProgressPlot";
import styles from "./index.module.scss";

export const StyledFullWidthBar = styled.div<{ activeData?: PlayerStateActiveData }>`
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  background-color: ${(props) => (props.activeData ? sharedColors.DARK8 : sharedColors.DARK5)};
  height: 4px;
`;

export const StyledMarker = styled.div.attrs<{ width: number }>(({ width }) => ({
  style: { left: `calc(${width * 100}% - 2px)` },
}))<{ width: number }>`
  background-color: white;
  position: absolute;
  height: 36%;
  border: 1px solid ${colors.divider};
  width: 2px;
  top: 32%;
`;

export type PlaybackControlProps = {
  player: PlayerState;
  auxiliaryData?: unknown;
  pause: () => void;
  play: () => void;
  seek: (arg0: Time) => void;
};

export const TooltipItem = ({ title, value }: { title: string; value: ReactNode }): JSX.Element => (
  <div>
    <span className={styles.tipTitle}>{title}:</span>
    <span className={styles.tipValue}>{value}</span>
  </div>
);

export const UnconnectedPlaybackControls = memo<PlaybackControlProps>(
  (props: PlaybackControlProps) => {
    const theme = useTheme();
    const el = useRef<HTMLDivElement>(ReactNull);
    const slider = useRef<Slider>(ReactNull);
    const [repeat, setRepeat] = useState(false);
    const [tooltipState, setTooltipState] = useState<
      { x: number; y: number; tip: JSX.Element } | undefined
    >();
    const { tooltip } = useTooltip({
      shown: tooltipState != undefined,
      noPointerEvents: true,
      targetPosition: { x: tooltipState?.x ?? 0, y: tooltipState?.y ?? 0 },
      contents: tooltipState?.tip,
    });
    const { seek, pause, play, player } = props;
    const [timezone] = useAppConfigurationValue<string>(AppSetting.TIMEZONE);
    const clearHoverValue = useClearHoverValue();
    const setHoverValue = useSetHoverValue();

    const iconButtonStyles = ({
      left = false,
      right = false,
    }: {
      // FIXME: should allow function call without args
      left?: boolean | undefined;
      right?: boolean | undefined;
    }) => {
      return {
        icon: {
          height: 20,
          color: theme.palette.neutralSecondary,
        },
        iconChecked: { color: theme.palette.themePrimary },
        root: {
          background: theme.semanticColors.buttonBackgroundHovered,

          ...(left && {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }),
          ...(right && {
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }),
        },
        rootHovered: { background: theme.semanticColors.buttonBackgroundPressed },
      } as IButtonStyles;
    };

    // playerState is unstable, and will cause callbacks to change identity every frame. They can take
    // a ref instead.
    const playerState = useRef(player);
    playerState.current = player;

    const onChange = useCallback((value: number) => seek(fromSec(value)), [seek]);

    const [hoverComponentId] = useState<string>(() => uuidv4());
    const onMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const { activeData } = playerState.current;
        if (!activeData) {
          return;
        }
        const { startTime } = activeData;
        if (el.current == undefined || slider.current == undefined) {
          return;
        }
        const currentEl = el.current;
        const currentSlider = slider.current;
        const x = e.clientX;
        // fix the y position of the tooltip to float on top of the playback bar
        const y = currentEl.getBoundingClientRect().top;

        const value = currentSlider.getValueAtMouse(e);
        const stamp = fromSec(value);
        const timeFromStart = subtractTimes(stamp, startTime);

        const tip = (
          <div className={styles.tip}>
            <TooltipItem title="ROS" value={formatTimeRaw(stamp)} />
            <TooltipItem title="Time" value={formatTime(stamp)} />
            <TooltipItem title="Elapsed" value={`${toSec(timeFromStart).toFixed(9)} sec`} />
          </div>
        );
        setTooltipState({ x, y, tip });
        setHoverValue({
          componentId: hoverComponentId,
          type: "PLAYBACK_SECONDS",
          value: toSec(timeFromStart),
        });
      },
      [setHoverValue, hoverComponentId],
    );

    const onMouseLeave = useCallback(() => {
      setTooltipState(undefined);
      clearHoverValue(hoverComponentId);
    }, [clearHoverValue, hoverComponentId]);

    // Clean up the hover value when we are unmounted -- important for storybook.
    useEffect(() => onMouseLeave, [onMouseLeave]);

    const { activeData, progress } = player;

    const { isPlaying, startTime, endTime, currentTime } = activeData ?? {};

    const min = startTime && toSec(startTime);
    const max = endTime && toSec(endTime);
    const value = currentTime == undefined ? undefined : toSec(currentTime);
    const step = ((max ?? 100) - (min ?? 0)) / 500;

    // repeat logic could also live in messagePipeline but since it is only triggered
    // from playback controls we've implemented it here for now - if there is demand
    // to toggle repeat from elsewhere this logic can move
    if (currentTime && endTime && compare(currentTime, endTime) >= 0) {
      // repeat
      if (startTime && repeat) {
        seek(startTime);
        // if the user turns on repeat and we are at the end, we assume they want to play from start
        // even if paused
        play();
      } else if (activeData?.isPlaying === true) {
        // no-repeat
        // pause playback to toggle pause button state
        // if the user clicks play while we are at the end, we go back to begginning
        pause();
      }
    }

    const resumePlay = useCallback(() => {
      const {
        startTime: start,
        endTime: end,
        currentTime: current,
      } = playerState.current?.activeData ?? {};
      // if we are at the end, we need to go back to start
      if (current && end && start && compare(current, end) >= 0) {
        seek(start);
      }
      play();
    }, [play, seek]);

    const toggleRepeat = useCallback(() => {
      setRepeat((old) => !old);
    }, []);

    const togglePlayPause = useCallback(() => {
      if (playerState.current?.activeData?.isPlaying === true) {
        pause();
      } else {
        resumePlay();
      }
    }, [pause, resumePlay]);

    const keyDownHandlers = useMemo(
      () => ({
        " ": togglePlayPause,
        ArrowLeft: (ev: KeyboardEvent) =>
          jumpSeek(DIRECTION.BACKWARD, { seek, player: playerState.current }, ev),
        ArrowRight: (ev: KeyboardEvent) =>
          jumpSeek(DIRECTION.FORWARD, { seek, player: playerState.current }, ev),
      }),
      [seek, togglePlayPause],
    );

    return (
      <Stack
        horizontal
        verticalAlign="center"
        tokens={{
          childrenGap: theme.spacing.s2,
          padding: theme.spacing.s1,
        }}
      >
        {tooltip}
        <KeyListener global keyDownHandlers={keyDownHandlers} />
        <Stack horizontal>
          <MessageOrderControls />
          <PlaybackSpeedControls />
        </Stack>
        <HoverableIconButton
          checked={repeat}
          disabled={!activeData}
          onClick={toggleRepeat}
          iconProps={{ iconName: "Loop", iconNameActive: "LoopSolid" }}
          styles={iconButtonStyles({})}
        />
        <HoverableIconButton
          checked={isPlaying}
          disabled={!activeData}
          onClick={isPlaying === true ? pause : resumePlay}
          iconProps={{
            iconName: isPlaying === true ? "Pause" : "Play",
            iconNameActive: isPlaying === true ? "PauseSolid" : "PlaySolid",
          }}
          styles={iconButtonStyles({})}
        />
        <div className={styles.bar}>
          <StyledFullWidthBar activeData={activeData} />
          <div className={styles.stateBar}>
            <ProgressPlot progress={progress} />
          </div>
          <div
            ref={el}
            className={styles.sliderContainer}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <Slider
              ref={slider}
              min={min ?? 0}
              max={max ?? 100}
              disabled={min == undefined || max == undefined}
              step={step}
              value={value}
              draggable
              onChange={onChange}
              renderSlider={(val) => (val == undefined ? undefined : <StyledMarker width={val} />)}
            />
          </div>
          <PlaybackBarHoverTicks componentId={hoverComponentId} />
        </div>
        <PlaybackTimeDisplayMethod
          currentTime={currentTime}
          startTime={startTime}
          endTime={endTime}
          onSeek={seek}
          onPause={pause}
          isPlaying={isPlaying ?? false}
          timezone={timezone}
        />
        <Stack horizontal>
          <IconButton
            iconProps={{ iconName: "Previous" }}
            disabled={!activeData}
            onClick={() =>
              jumpSeek(DIRECTION.BACKWARD, {
                seek,
                player: playerState.current,
              })
            }
            styles={iconButtonStyles({ left: true })}
          />
          <IconButton
            iconProps={{ iconName: "Next" }}
            disabled={!activeData}
            onClick={() =>
              jumpSeek(DIRECTION.FORWARD, {
                seek,
                player: playerState.current,
              })
            }
            styles={iconButtonStyles({ right: true })}
          />
        </Stack>
      </Stack>
    );
  },
);

function getPause(ctx: MessagePipelineContext) {
  return ctx.pausePlayback;
}

function getPlay(ctx: MessagePipelineContext) {
  return ctx.startPlayback;
}

function getSeek(ctx: MessagePipelineContext) {
  return ctx.seekPlayback;
}

function getPlayer(ctx: MessagePipelineContext) {
  return ctx.playerState;
}

export default function PlaybackControls(): JSX.Element {
  const pause = useMessagePipeline(getPause);
  const play = useMessagePipeline(getPlay);
  const seek = useMessagePipeline(getSeek);
  const player = useMessagePipeline(getPlayer);

  return <UnconnectedPlaybackControls pause={pause} seek={seek} play={play} player={player} />;
}
