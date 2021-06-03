// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { IconButton, IStyle, makeStyles, Stack, Text, useTheme } from "@fluentui/react";
import cx from "classnames";
import { useCallback } from "react";
import { useAsync } from "react-use";
import { AsyncState } from "react-use/lib/useAsyncFn";

import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import {
  useCurrentLayoutActions,
  useCurrentLayoutSelector,
} from "@foxglove/studio-base/context/CurrentLayoutContext";
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import { useRemoteLayoutStorage } from "@foxglove/studio-base/context/RemoteLayoutStorageContext";

type LayoutItem = {
  uid: string;
  name: string;
};

// https://github.com/microsoft/fluentui/issues/18423
const useStyles = makeStyles<
  { [key in "layoutRow" | "layoutName" | "layoutRowSelected" | "sectionHeader"]: IStyle }
>((theme) => ({
  layoutRow: {
    cursor: "pointer",
    paddingLeft: theme.spacing.m,
    paddingRight: theme.spacing.s1,
    ":hover": {
      background: theme.semanticColors.listItemBackgroundHovered,
    },
  },

  layoutRowSelected: {
    background: theme.semanticColors.listItemBackgroundChecked,
    ":hover": {
      background: theme.semanticColors.listItemBackgroundCheckedHovered,
    },
  },

  layoutName: {
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },

  sectionHeader: [
    theme.fonts.medium,
    {
      fontVariant: "small-caps",
      textTransform: "lowercase",
      color: theme.palette.neutralSecondaryAlt,
      letterSpacing: "0.5px",
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.m,
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.s1,
    },
  ],
}));

function LayoutRow({
  layout,
  selected,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: {
  layout: LayoutItem;
  selected: boolean;
  onSelect: (item: LayoutItem) => void;
  onRename: (item: LayoutItem) => void;
  onDuplicate: (item: LayoutItem) => void;
  onDelete: (item: LayoutItem) => void;
}): JSX.Element {
  const styles = useStyles();

  //FIXME: hooks for these?
  const selectAction = useCallback(() => onSelect(layout), [layout, onSelect]);
  const renameAction = useCallback(() => onRename(layout), [layout, onRename]);
  const duplicateAction = useCallback(() => onDuplicate(layout), [layout, onDuplicate]);
  const deleteAction = useCallback(() => onDelete(layout), [layout, onDelete]);

  return (
    <Stack
      horizontal
      verticalAlign="center"
      className={cx(styles.layoutRow, { [styles.layoutRowSelected]: selected })}
      onClick={selectAction}
    >
      <Stack.Item grow className={styles.layoutName} title={layout.name}>
        {layout.name}
      </Stack.Item>

      <IconButton
        iconProps={{
          iconName: "More",
          styles: { root: { "& span": { verticalAlign: "baseline" } } },
        }}
        onRenderMenuIcon={() => ReactNull}
        menuProps={{
          items: [
            {
              key: "rename",
              text: "Rename",
              iconProps: { iconName: "Rename" },
              onClick: renameAction,
            },
            {
              key: "duplicate",
              text: "Duplicate",
              iconProps: { iconName: "Copy" },
              onClick: duplicateAction,
            },
            {
              key: "delete",
              text: "Delete",
              iconProps: { iconName: "Delete" },
              disabled: selected,
              onClick: deleteAction,
            },
          ],
        }}
      />
    </Stack>
  );
}

function LayoutSection({
  title,
  items,
  onSelect,
  selectedId,
}: {
  title: string;
  items: AsyncState<LayoutItem[]>;
  onSelect: (item: LayoutItem) => void;
  selectedId?: string;
}): JSX.Element {
  const styles = useStyles();
  return (
    <Stack>
      <Text as="h2" className={styles.sectionHeader}>
        {title}
      </Text>
      <Stack.Item>
        {items.loading ? "Loading" : items.error ? `Error: ${items.error}` : undefined}
        {items.value?.map((layout) => (
          <LayoutRow
            selected={layout.uid === selectedId}
            key={layout.uid}
            layout={layout}
            onSelect={onSelect}
            onRename={() => {}}
            onDuplicate={() => {}}
            onDelete={() => {}}
          />
        ))}
      </Stack.Item>
    </Stack>
  );
}

export default function LayoutBrowser(): JSX.Element {
  const localLayoutStorage = useLayoutStorage();
  const remoteLayoutStorage = useRemoteLayoutStorage();

  const currentLayoutId = useCurrentLayoutSelector((state) => state.id);
  const { loadLayout } = useCurrentLayoutActions();

  const localLayouts = useAsync(async () => {
    return (await localLayoutStorage.list()).map((layout) => ({ ...layout, uid: layout.id }));
  }, [localLayoutStorage]);
  const remotePersonalLayouts = useAsync(
    () => remoteLayoutStorage.getCurrentUserLayouts(),
    [remoteLayoutStorage],
  );
  const remoteSharedLayouts = useAsync(
    () => remoteLayoutStorage.getSharedLayouts(),
    [remoteLayoutStorage],
  );

  const onSelectLocalLayout = useCallback(
    async (item: LayoutItem) => {
      const layout = await localLayoutStorage.get(item.uid);
      if (layout?.state) {
        loadLayout(layout.state);
      }
    },
    [loadLayout, localLayoutStorage],
  );

  const theme = useTheme();
  const { createNewLayout } = useCurrentLayoutActions();
  return (
    <SidebarContent title="Layouts" noPadding>
      <Stack
        horizontal
        tokens={{ childrenGap: theme.spacing.s1 }}
        style={{ position: "absolute", top: theme.spacing.s2, right: theme.spacing.s2 }}
      >
        <IconButton iconProps={{ iconName: "Add" }} onClick={createNewLayout} />
      </Stack>
      <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
        <Stack.Item>
          <LayoutSection
            title="Local layouts"
            items={localLayouts}
            selectedId={currentLayoutId}
            onSelect={onSelectLocalLayout}
          />
        </Stack.Item>

        <Stack.Item>
          <LayoutSection
            title="Remote personal layouts"
            items={remotePersonalLayouts}
            onSelect={() => {}}
          />
        </Stack.Item>

        <Stack.Item>
          <LayoutSection
            title="Remote shared layouts"
            items={remoteSharedLayouts}
            onSelect={() => {}}
          />
        </Stack.Item>
      </Stack>
    </SidebarContent>
  );
}
