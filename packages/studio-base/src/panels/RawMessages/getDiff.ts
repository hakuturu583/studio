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
import { every, uniq, keyBy, isEmpty } from "lodash";

import { isTypicalFilterName } from "@foxglove/studio-base/components/MessagePathSyntax/isTypicalFilterName";
import { jsonTreeTheme } from "@foxglove/studio-base/util/globalConstants";
import { colors } from "@foxglove/studio-base/util/sharedStyleConstants";

export const diffArrow = "->";
export const diffLabels = {
  ADDED: {
    labelText: "STUDIO_DIFF___ADDED",
    color: colors.DARK6,
    backgroundColor: "#182924",
    indicator: "+",
  },
  DELETED: {
    labelText: "STUDIO_DIFF___DELETED",
    color: colors.DARK6,
    backgroundColor: "#3d2327",
    indicator: "-",
  },
  CHANGED: { labelText: "STUDIO_DIFF___CHANGED", color: jsonTreeTheme.base0B },
  ID: { labelText: "STUDIO_DIFF___ID" },
} as const;

export const diffLabelsByLabelText = keyBy(Object.values(diffLabels), "labelText");

export type DiffObject = Record<string, unknown>;
export default function getDiff(
  before: unknown,
  after: unknown,
  idLabel?: string,
  showFullMessageForDiff: boolean = false,
): undefined | DiffObject | DiffObject[] {
  if (Array.isArray(before) && Array.isArray(after)) {
    let idToCompareWith: string | undefined;
    const allItems = before.concat(after);
    if (allItems[0] && typeof allItems[0] === "object") {
      let candidateIdsToCompareWith: Record<string, { before: unknown[]; after: unknown[] }> = {};
      if (allItems[0].id != undefined) {
        candidateIdsToCompareWith.id = { before: [], after: [] };
      }
      for (const key in allItems[0]) {
        if (isTypicalFilterName(key)) {
          candidateIdsToCompareWith[key] = { before: [], after: [] };
        }
      }
      if (!every(allItems, (item) => item && typeof item === "object")) {
        candidateIdsToCompareWith = {};
      }
      for (const [idKey, candidates] of Object.entries(candidateIdsToCompareWith)) {
        for (const beforeItem of before) {
          if (beforeItem[idKey] != undefined) {
            candidates.before.push(beforeItem[idKey]);
          }
        }
      }
      for (const [idKey, candidates] of Object.entries(candidateIdsToCompareWith)) {
        for (const afterItem of after) {
          if (afterItem[idKey] != undefined) {
            candidates.after.push(afterItem[idKey]);
          }
        }
      }
      for (const [idKey, { before: candidateIdBefore, after: candidateIdAfter }] of Object.entries(
        candidateIdsToCompareWith,
      )) {
        if (
          uniq(candidateIdBefore).length === before.length &&
          uniq(candidateIdAfter).length === after.length
        ) {
          idToCompareWith = idKey;
          break;
        }
      }
    }

    if (idToCompareWith != undefined) {
      const unmatchedAfterById = keyBy(after, idToCompareWith);
      const diff = [];
      for (const beforeItem of before) {
        if (!beforeItem || typeof beforeItem !== "object") {
          throw new Error("beforeItem is invalid; should have checked this earlier");
        }
        const id = beforeItem[idToCompareWith];
        const innerDiff = getDiff(
          beforeItem,
          unmatchedAfterById[id],
          idToCompareWith,
          showFullMessageForDiff,
        );
        delete unmatchedAfterById[id];
        if (!isEmpty(innerDiff)) {
          const isDeleted =
            Object.keys(innerDiff as DiffObject).length === 1 &&
            Object.keys(innerDiff as DiffObject)[0] === diffLabels.DELETED.labelText;
          diff.push(
            isDeleted
              ? (innerDiff as DiffObject)
              : {
                  [diffLabels.ID.labelText]: { [idToCompareWith]: id },
                  ...(innerDiff as DiffObject),
                },
          );
        }
      }
      for (const afterItem of Object.values(unmatchedAfterById)) {
        const innerDiff = getDiff(undefined, afterItem, idToCompareWith, showFullMessageForDiff);
        if (!isEmpty(innerDiff)) {
          diff.push(innerDiff as DiffObject);
        }
      }
      return diff;
    }
  }

  if (before && after && typeof before === "object" && typeof after === "object") {
    const diff: DiffObject = {};
    const allKeys = Object.keys(before).concat(Object.keys(after));
    for (const key of uniq(allKeys)) {
      const innerDiff = getDiff(
        (before as DiffObject)[key],
        (after as DiffObject)[key],
        undefined,
        showFullMessageForDiff,
      );
      if (!isEmpty(innerDiff)) {
        diff[key] = innerDiff;
      } else if (showFullMessageForDiff) {
        diff[key] = (before as DiffObject)[key];
      }
    }
    return diff;
  }

  if (before === after) {
    return undefined;
  }
  if (before == undefined) {
    const afterIsNotObj = Array.isArray(after) || typeof after !== "object";
    if (!idLabel || afterIsNotObj) {
      return { [diffLabels.ADDED.labelText]: after };
    }
    const idLabelObj = {
      [diffLabels.ID.labelText]: { [idLabel]: { ...(after as DiffObject) }[idLabel] },
    };
    return {
      [diffLabels.ADDED.labelText]: { ...idLabelObj, ...(after as DiffObject) },
    };
  }
  if (after == undefined) {
    const beforeIsNotObj = Array.isArray(before) || typeof before !== "object";
    if (!idLabel || beforeIsNotObj) {
      return { [diffLabels.DELETED.labelText]: before };
    }
    const idLabelObj = {
      [diffLabels.ID.labelText]: { [idLabel]: { ...(before as DiffObject) }[idLabel] },
    };
    return {
      [diffLabels.DELETED.labelText]: { ...idLabelObj, ...(before as DiffObject) },
    };
  }

  const beforeText = typeof before === "bigint" ? before.toString() : JSON.stringify(before);
  const afterText = typeof after === "bigint" ? after.toString() : JSON.stringify(after);

  return {
    [diffLabels.CHANGED.labelText]: `${beforeText} ${diffArrow} ${afterText}`,
  };
}
