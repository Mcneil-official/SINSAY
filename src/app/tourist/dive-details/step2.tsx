import { Redirect } from "expo-router";
import React from "react";

// Keep the old deep link working while certification now lives in the
// Dive Credentials step of the unified diver profile wizard.
export default function LegacyDiveCertificationRoute() {
  return <Redirect href="/tourist/dive-details/step1" />;
}
