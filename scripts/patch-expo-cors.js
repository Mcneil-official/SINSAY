const fs = require('fs');
const path = require('path');

function findFiles(dir, fileName, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git') {
        findFiles(fullPath, fileName, results);
      }
    } else if (entry.name === fileName) {
      results.push(fullPath);
    }
  }
  return results;
}

const nodeModulesDir = path.resolve(__dirname, '../node_modules');
const corsFiles = findFiles(nodeModulesDir, 'CorsMiddleware.js');

console.log(`[patch-expo-cors] Found ${corsFiles.length} CorsMiddleware.js file(s).`);

for (const corsPath of corsFiles) {
  let content = fs.readFileSync(corsPath, 'utf8');

  // Replace strict allowedHost check to allow Cloud Run / AI Studio preview origins
  const target = 'const isAllowedHost = allowedHosts.includes(host) || isLocalhost;';
  const replacement = 'const isAllowedHost = true; // Allow all hosts for AI Studio preview / Cloud Run';

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(corsPath, content, 'utf8');
    console.log(`[patch-expo-cors] Patched: ${corsPath}`);
  } else if (content.includes('const isAllowedHost = true;')) {
    console.log(`[patch-expo-cors] Already patched: ${corsPath}`);
  } else {
    console.warn(`[patch-expo-cors] Target string not found in: ${corsPath}`);
  }
}
