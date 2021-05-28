// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

// Bring in global modules and overrides required by studio source files
// This adds type declarations for scss, bag, etc imports
// This adds type declarations for global react
// See typings/index.d.ts for additional included references
/// <reference types="./typings" />

export { default as App } from "./App";
export type { NetworkInterface, OsContext } from "./OsContext";
export { default as ErrorBoundary } from "./components/ErrorBoundary";
export { default as MultiProvider } from "./components/MultiProvider";
export { default as AppConfigurationContext } from "./context/AppConfigurationContext";
export type {
  AppConfiguration,
  AppConfigurationValue,
  ChangeHandler,
} from "./context/AppConfigurationContext";
export { default as LayoutStorageContext } from "./context/LayoutStorageContext";
export type { Layout, LayoutStorage } from "./context/LayoutStorageContext";
export { default as NativeAppMenuContext } from "./context/NativeAppMenuContext";
export type { NativeAppMenu, NativeAppMenuEvent } from "./context/NativeAppMenuContext";
export type { PlayerSourceDefinition } from "./context/PlayerSelectionContext";
export { default as ThemeProvider } from "./theme/ThemeProvider";
export { default as installDevtoolsFormatters } from "./util/installDevtoolsFormatters";
export { initializeLogEvent } from "./util/logEvent";
export { default as overwriteFetch } from "./util/overwriteFetch";
export { default as FirebaseAuth } from "./services/FirebaseAuth";
export { default as waitForFonts } from "./util/waitForFonts";
export { default as UserProfileLocalStorageProvider } from "./providers/UserProfileLocalStorageProvider";
export { default as FirebaseAppProvider } from "./providers/FirebaseAppProvider";
export { default as FirebaseAuthProvider } from "./providers/FirebaseAuthProvider";
export { useFirebase } from "./context/FirebaseAppContext";
export { default as FirebaseRemoteLayoutStorageProvider } from "./providers/FirebaseRemoteLayoutStorageProvider";
export { default as StudioToastProvider } from "./components/StudioToastProvider";
export { default as ExtensionLoaderContext } from "./context/ExtensionLoaderContext";
export type { ExtensionLoader, ExtensionDetail } from "./context/ExtensionLoaderContext";
