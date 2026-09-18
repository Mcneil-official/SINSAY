// Disable standalone Electron DevTools attempt in container/headless environment
process.env.EXPO_UNSTABLE_HEADLESS = "1";

// Ensure Expo CLI's CorsMiddleware allows reverse-proxy requests from Cloud Run / AI Studio preview iframe
try {
  const fs = require("fs");
  const path = require("path");
  const corsPath = path.resolve(
    __dirname,
    "node_modules/@expo/cli/build/src/start/server/middleware/CorsMiddleware.js"
  );
  if (fs.existsSync(corsPath)) {
    let content = fs.readFileSync(corsPath, "utf8");
    if (content.includes("const isAllowedHost = allowedHosts.includes(host) || isLocalhost;")) {
      content = content.replace(
        "const isAllowedHost = allowedHosts.includes(host) || isLocalhost;",
        "const isAllowedHost = true;"
      );
      fs.writeFileSync(corsPath, content, "utf8");
    }
  }
} catch {
  // best effort
}

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });

