// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import { Stack, Text, useTheme } from "@fluentui/react";
import { useAsync } from "react-use";

import { SidebarContent } from "@foxglove/studio-base/components/SidebarContent";
import { useLayoutStorage } from "@foxglove/studio-base/context/LayoutStorageContext";
import { useRemoteLayoutStorage } from "@foxglove/studio-base/context/RemoteLayoutStorageContext";

export default function LayoutBrowser(): JSX.Element {
  const localLayoutStorage = useLayoutStorage();
  const remoteLayoutStorage = useRemoteLayoutStorage();

  const localLayouts = useAsync(() => localLayoutStorage.list(), [localLayoutStorage]);
  const remotePersonalLayouts = useAsync(
    () => remoteLayoutStorage.getCurrentUserLayouts(),
    [remoteLayoutStorage],
  );
  const remoteSharedLayouts = useAsync(
    () => remoteLayoutStorage.getSharedLayouts(),
    [remoteLayoutStorage],
  );

  const theme = useTheme();
  return (
    <SidebarContent title="Layouts">
      <Stack tokens={{ childrenGap: theme.spacing.s1 }}>
        <Stack.Item>
          <Stack>
            <Text as="h2" variant="large">
              Local layouts
            </Text>
            <Stack.Item>
              {localLayouts.loading
                ? "Loading"
                : localLayouts.error
                ? `Error: ${localLayouts.error}`
                : localLayouts.value?.map((layout) => {
                    return layout.name;
                  })}
            </Stack.Item>
          </Stack>
        </Stack.Item>

        <Stack.Item>
          <Stack>
            <Text as="h2" variant="large">
              Remote personal layouts
            </Text>
            <Stack.Item>
              {remotePersonalLayouts.loading
                ? "Loading"
                : remotePersonalLayouts.error
                ? `Error: ${remotePersonalLayouts.error}`
                : remotePersonalLayouts.value?.map((layout) => {
                    return layout.name;
                  })}
            </Stack.Item>
          </Stack>
        </Stack.Item>

        <Stack.Item>
          <Text as="h2" variant="large">
            Remote shared layouts
          </Text>
          <Stack.Item>
            {remoteSharedLayouts.loading
              ? "Loading"
              : remoteSharedLayouts.error
              ? `Error: ${remoteSharedLayouts.error}`
              : remoteSharedLayouts.value?.map((layout) => {
                  return layout.name;
                })}
          </Stack.Item>
        </Stack.Item>
      </Stack>
    </SidebarContent>
  );
}
