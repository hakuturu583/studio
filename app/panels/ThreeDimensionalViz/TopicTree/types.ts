//
//  Copyright (c) 2018-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
import { Color } from "regl-worldview";

import { Save3DConfig } from "../index";
import { TopicDisplayMode as DisplayMode } from "./TopicViewModeSelector";
import SceneBuilder from "@foxglove-studio/app/panels/ThreeDimensionalViz/SceneBuilder/index";
import Transforms from "@foxglove-studio/app/panels/ThreeDimensionalViz/Transforms";
import { Topic } from "@foxglove-studio/app/players/types";

export type TopicDisplayMode = DisplayMode;
export type TopicTreeConfig = {
  name?: string;
  // displayName is only used to maintain TopicGroups flow type.
  displayName?: string;
  topicName?: string;
  children?: TopicTreeConfig[];
  description?: string;

  // Previous names or ids for this item under which it might be saved in old layouts.
  // Used for automatic conversion so that old saved layouts continue to work when tree nodes are renamed.
  legacyIds?: string[];
};

export type NamespacesByTopic = {
  [topicName: string]: string[];
};
type EditingNamespace = { namespaceKey: string; namespaceColor: string | null | undefined };
export type SetEditingNamespace = (arg0: EditingNamespace | null | undefined) => void;

export type TreeGroupNode = {
  type: "group";
  name: string;
  key: string;
  featureKey: string;
  parentKey?: string;
  availableByColumn: boolean[];
  // Whether the data providers are available. If it is and the current node is not available, we'll show
  // the node name being striked through in the UI.
  providerAvailable: boolean;
  // eslint-disable-next-line
  children: TreeNode[];
};
export type TreeTopicNode = {
  type: "topic";
  topicName: string;
  key: string;
  featureKey: string;
  parentKey?: string;
  name?: string;
  datatype?: string;
  description?: string;
  providerAvailable: boolean;
  availableByColumn: boolean[];
};

export type TreeNode = TreeGroupNode | TreeTopicNode;

export type UseSceneBuilderAndTransformsDataInput = {
  sceneBuilder: SceneBuilder;
  staticallyAvailableNamespacesByTopic: NamespacesByTopic;
  transforms: Transforms;
};

export type SceneErrorsByKey = {
  [topicName: string]: string[];
};

export type UseSceneBuilderAndTransformsDataOutput = {
  availableNamespacesByTopic: NamespacesByTopic;
  sceneErrorsByKey: SceneErrorsByKey;
};

export type UseTreeInput = {
  availableNamespacesByTopic: NamespacesByTopic;
  checkedKeys: string[];
  defaultTopicSettings: {
    [topicName: string]: any;
  };
  expandedKeys: string[];
  filterText: string;
  modifiedNamespaceTopics: string[];
  providerTopics: Topic[]; // Only changes when e.g. dragging in a new bag.
  saveConfig: Save3DConfig;
  sceneErrorsByTopicKey: SceneErrorsByKey;
  topicDisplayMode: TopicDisplayMode;
  settingsByKey: {
    [topicOrNamespaceKey: string]: any;
  };
  topicTreeConfig: TopicTreeConfig; // Never changes!
  uncategorizedGroupName: string;
};

export type GetIsTreeNodeVisibleInScene = (
  topicNode: TreeNode,
  columnIndex: number,
  namespaceKey?: string,
) => boolean;
export type GetIsTreeNodeVisibleInTree = (key: string) => boolean;
export type SetCurrentEditingTopic = (arg0: Topic | null | undefined) => void;
export type ToggleNode = (nodeKey: string, namespaceParentTopicName?: string) => void;
export type ToggleNodeByColumn = (
  nodeKey: string,
  columnIndex: number,
  namespaceParentTopicName?: string,
) => void;
export type ToggleNamespaceChecked = (arg0: {
  topicName: string;
  namespace: string;
  columnIndex: number;
}) => void;
export type GetIsNamespaceCheckedByDefault = (topicName: string, columnIndex: number) => boolean;
export type DerivedCustomSettings = {
  overrideColorByColumn?: (string | null | undefined)[];
  isDefaultSettings: boolean;
};
export type DerivedCustomSettingsByKey = {
  [key: string]: DerivedCustomSettings;
};
export type OnNamespaceOverrideColorChange = (
  newRbgaColor: Color | null | undefined,
  prefixedNamespaceKey: string,
) => void;
export type VisibleTopicsCountByKey = {
  [nodeKey: string]: number;
};
export type UseTreeOutput = {
  // Instead of precomputing visible states for all nodes, pass the function down to the nodes
  // so that only rendered nodes' visibility is computed since we support virtualization in the tree.
  getIsTreeNodeVisibleInScene: GetIsTreeNodeVisibleInScene;
  getIsTreeNodeVisibleInTree: GetIsTreeNodeVisibleInTree;
  getIsNamespaceCheckedByDefault: GetIsNamespaceCheckedByDefault;
  hasFeatureColumn: boolean;
  // For testing.
  nodesByKey: {
    [key: string]: TreeNode;
  };
  onNamespaceOverrideColorChange: OnNamespaceOverrideColorChange;
  toggleCheckAllAncestors: ToggleNodeByColumn;
  toggleCheckAllDescendants: ToggleNodeByColumn;
  toggleNamespaceChecked: ToggleNamespaceChecked;
  toggleNodeChecked: ToggleNodeByColumn;
  toggleNodeExpanded: ToggleNode;
  rootTreeNode: TreeNode;
  selectedNamespacesByTopic: {
    [topicName: string]: string[];
  };
  selectedTopicNames: string[];
  derivedCustomSettingsByKey: DerivedCustomSettingsByKey;
  sceneErrorsByKey: SceneErrorsByKey;
  allKeys: string[];
  shouldExpandAllKeys: boolean;
  visibleTopicsCountByKey: VisibleTopicsCountByKey;
};

export type EditingTopic = {
  name: string;
  datatype: string;
};