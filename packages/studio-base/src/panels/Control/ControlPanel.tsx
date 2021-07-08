// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { makeStyles } from "@fluentui/react";
import clsx from "clsx";
import { useState } from "react";

import { PanelExtensionContext } from "@foxglove/studio";

const useStyles = makeStyles((theme) => ({
  // FIXME: This `theme` is not the theme from the current <ThemeProvider />
  // maybe `makeStyles` doesn't work how I think it does?
  root: {
    backgroundColor: theme.semanticColors.bodyBackground,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    width: "100%",
    height: "100%",
  },
  control: {
    maxHeight: "100%",
    maxWidth: "100%",
  },
  buttonBackground: {
    cursor: "pointer",
    fill: theme.semanticColors.buttonBackground,
    transition: "fill 200ms, stroke 30ms",
    stroke: theme.semanticColors.primaryButtonBackgroundPressed,
    strokeWidth: 1,
  },
  buttonBackgroundPressed: {
    fill: `${theme.semanticColors.primaryButtonBackground} !important`,
    stroke: `${theme.semanticColors.primaryButtonBackgroundPressed} !important`,
  },
  buttonText: {
    cursor: "pointer",
    fill: theme.semanticColors.buttonText,
    transition: "fill 200ms",
  },
  stopButtonBackgroud: {
    cursor: "pointer",
    fill: theme.semanticColors.errorText,
    transition: "fill 200ms",
  },
  stopButtonBackgroudDisabled: {
    fillOpacity: 0.4,
  },
  stopText: {
    cursor: "pointer",
    userSelect: "none",
    fill: theme.semanticColors.bodyBackground,
    fontSize: "24px",
    fontFamily: "sans-serif",
  },
  stopTextDisabled: {
    fill: `${theme.semanticColors.primaryButtonText} !important`,
  },
}));

type ControlPanelProps = {
  context: PanelExtensionContext;
  disableStop?: boolean;
  disableX?: boolean;
  disableY?: boolean;
};

function ControlPanel({
  disableStop = false,
  disableX = false,
  disableY = false,
}: ControlPanelProps): JSX.Element {
  // FIXME: Keyboard shortcut mappings
  // FIXME: Send commands back to ROS

  const classes = useStyles();
  const [state, setState] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    active: false,
  });

  const handleStop = () => {
    if (!state.active) {
      return setState(state);
    }

    return setState({
      ...state,
      active: false,
    });
  };
  const handleMouseDown = (value: string) => {
    setState({ ...state, active: true, [value]: true });
  };
  const handleMouseUp = (value: string) => {
    setState({ ...state, [value]: false });
  };
  const handleClick = (value: string) => ({
    onMouseDown: () => handleMouseDown(value),
    onMouseUp: () => handleMouseUp(value),
    onMouseLeave: () => handleMouseUp(value),
  });

  return (
    <div className={classes.root}>
      <svg className={classes.control} viewBox="0 0 256 256">
        {!disableY && (
          <>
            {/* UP button */}
            <g {...handleClick("up")}>
              <path
                className={clsx(classes.buttonBackground, {
                  [classes.buttonBackgroundPressed]: state.up,
                })}
                d="M162.707,78.945c-20.74,-14.771 -48.795,-14.771 -69.535,-0l-42.723,-42.723c44.594,-37.791 110.372,-37.794 154.981,-0l-42.723,42.723Z"
              />
              <path className={classes.buttonText} d="M128,30.364l20,20l-40,-0l20,-20Z" />
            </g>

            {/* DOWN button */}
            <g {...handleClick("down")}>
              <path
                className={clsx(classes.buttonBackground, {
                  [classes.buttonBackgroundPressed]: state.down,
                })}
                d="M93.172,176.764c20.74,14.771 48.795,14.771 69.535,0l42.723,42.723c-44.594,37.791 -110.372,37.794 -154.981,0l42.723,-42.723Z"
              />
              <path className={classes.buttonText} d="M128,225.345l-20,-20l40,0l-20,20Z" />
            </g>
          </>
        )}

        {!disableX && (
          <>
            {/* LEFT button */}
            <g {...handleClick("left")}>
              <path
                className={clsx(classes.buttonBackground, {
                  [classes.buttonBackgroundPressed]: state.left,
                })}
                d="M36.307,205.345c-37.793,-44.609 -37.791,-110.387 -0,-154.981l42.723,42.723c-14.771,20.74 -14.771,48.795 -0,69.535l-42.723,42.723Z"
              />
              <path className={classes.buttonText} d="M30.449,127.854l20,-20l0,40l-20,-20Z" />
            </g>

            {/* RIGHT button */}
            <g {...handleClick("right")}>
              <path
                className={clsx(classes.buttonBackground, {
                  [classes.buttonBackgroundPressed]: state.right,
                })}
                d="M219.572,50.364c37.794,44.609 37.791,110.387 0.001,154.981l-42.724,-42.723c14.771,-20.74 14.771,-48.795 0,-69.535l42.723,-42.723Z"
              />
              <path className={classes.buttonText} d="M225.43,127.854l-20,20l0,-40l20,20Z" />
            </g>
          </>
        )}

        {/* STOP button */}
        {!disableStop && (
          <g onClick={handleStop}>
            <circle
              className={clsx(classes.stopButtonBackgroud, {
                [classes.stopButtonBackgroudDisabled]: !state.active,
              })}
              cx="128"
              cy="128"
              r="45"
            />
            <text
              x={128}
              dy={9}
              y={128}
              textAnchor="middle"
              className={clsx(classes.stopText, {
                [classes.stopTextDisabled]: !state.active,
              })}
            >
              <tspan>STOP</tspan>
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default ControlPanel;
