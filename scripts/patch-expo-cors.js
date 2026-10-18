const fs = require('fs');
const path = require('path');

const corsPath = path.resolve(
  __dirname,
  '../node_modules/@expo/cli/build/src/start/server/middleware/CorsMiddleware.js'
);

if (fs.existsSync(corsPath)) {
  let content = fs.readFileSync(corsPath, 'utf8');

  // Replace strict allowedHost check to allow Cloud Run / AI Studio preview origins
  const target = 'const isAllowedHost = allowedHosts.includes(host) || isLocalhost;';
  const replacement = 'const isAllowedHost = true; // Allow all hosts for AI Studio preview / Cloud Run';

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(corsPath, content, 'utf8');
    console.log('[patch-expo-cors] Successfully patched CorsMiddleware.js to allow Cloud Run origins.');
  } else if (content.includes('const isAllowedHost = true;')) {
    console.log('[patch-expo-cors] Already patched.');
  } else {
    console.warn('[patch-expo-cors] Target string not found in CorsMiddleware.js');
  }
} else {
  console.log('[patch-expo-cors] CorsMiddleware.js not found, skipping patch.');
}
