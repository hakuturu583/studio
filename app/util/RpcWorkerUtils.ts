//
//  Copyright (c) 2020-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

import overwriteFetch from "./overwriteFetch";
import Rpc from "./Rpc";
import { initializeLogEvent } from "@foxglove-studio/app/util/logEvent";
import {
  setNotificationHandler,
  DetailsType,
  NotificationType,
} from "@foxglove-studio/app/util/sendNotification";
import { NotificationSeverity } from "@foxglove-studio/app/util/sendNotification";

export function setupSendReportNotificationHandler(rpc: Rpc) {
  setNotificationHandler(
    (
      message: string,
      details: DetailsType,
      type: NotificationType,
      severity: NotificationSeverity,
    ) => {
      if (!(details instanceof Error || typeof details === "string")) {
        console.warn("Invalid Error type");
        details = JSON.stringify(details) || "<<unknown error>>";
      }
      rpc.send("sendNotification", {
        message,
        details: details instanceof Error ? details.toString() : details,
        type,
        severity,
      });
    },
  );
}

export function setupLogEventHandler(rpc: Rpc) {
  initializeLogEvent((param) => {
    rpc.send("logEvent", param);
  });
}

export function setupWorker(rpc: Rpc) {
  if (process.env.NODE_ENV !== "test") {
    setupSendReportNotificationHandler(rpc);
    setupLogEventHandler(rpc);
    overwriteFetch();
  }
}