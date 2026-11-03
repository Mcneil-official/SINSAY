const fs = require("fs");
const path = require("path");

function findFiles(dir, fileName, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      findFiles(fullPath, fileName, results);
    } else if (entry.name === fileName) {
      results.push(fullPath);
    }
  }
  return results;
}

const nodeModulesDir = path.resolve(__dirname, "../node_modules");

// ---------------------------------------------------------------------------
// Patch 1: react-native-svg — stop injecting inert RN responder props
// (onStartShouldSetResponder, onResponderGrant, ...) onto raw SVG DOM
// elements. RNW 0.21 has no global responder dispatcher, so these props are
// ignored by React DOM and only produce "Unknown event handler property"
// warnings. Press keeps working via prepare()'s onPress -> onClick mapping.
// ---------------------------------------------------------------------------
const svgPatches = [
  {
    // src/web/utils/prepare.ts and lib/module/web/utils/prepare.js
    target: "...(hasTouchableProperty(props)",
    replacement: "...(false && hasTouchableProperty(props)",
    already: "...(false && hasTouchableProperty(props)",
    label: "react-native-svg prepare (src/module)",
  },
  {
    // lib/commonjs/web/utils/prepare.js
    target: "...((0, _hasProperty.hasTouchableProperty)(props)",
    replacement: "...(false && (0, _hasProperty.hasTouchableProperty)(props)",
    already: "...(false && (0, _hasProperty.hasTouchableProperty)(props)",
    label: "react-native-svg prepare (commonjs)",
  },
];

const svgFiles = findFiles(
  nodeModulesDir,
  "prepare.js"
).concat(findFiles(nodeModulesDir, "prepare.ts"));

console.log(`[patch-console-warnings] Found ${svgFiles.length} prepare file(s).`);

for (const filePath of svgFiles) {
  if (!filePath.includes(`react-native-svg${path.sep}`)) continue;
  let content = fs.readFileSync(filePath, "utf8");
  let patched = false;

  for (const patch of svgPatches) {
    if (content.includes(patch.target)) {
      content = content.replace(patch.target, patch.replacement);
      patched = true;
      break;
    }
    if (content.includes(patch.already)) {
      console.log(`[patch-console-warnings] Already patched: ${filePath}`);
      patched = false;
      break;
    }
  }

  if (patched) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[patch-console-warnings] Patched: ${filePath}`);
  }
}

// ---------------------------------------------------------------------------
// Patch 2: expo-router — remove aria-hidden={!focused} from the stack Screen
// container. NativeStackView already sets display:none on the same element
// (redundant for AT), and the aria-hidden causes Chrome's "Blocked aria-hidden
// on an element because its descendant retained focus" warning after tapping a
// button that navigates (button keeps DOM focus inside the hidden screen).
// ---------------------------------------------------------------------------
const screenPath = path.join(
  nodeModulesDir,
  "expo-router",
  "build",
  "react-navigation",
  "elements",
  "Screen.js"
);

if (fs.existsSync(screenPath)) {
  let content = fs.readFileSync(screenPath, "utf8");
  const target = '"aria-hidden": !focused, ';

  if (content.includes(target)) {
    content = content.replace(target, "");
    fs.writeFileSync(screenPath, content, "utf8");
    console.log(`[patch-console-warnings] Patched: ${screenPath}`);
  } else if (!content.includes('"aria-hidden": !focused')) {
    console.log(`[patch-console-warnings] Already patched: ${screenPath}`);
  } else {
    console.warn(
      `[patch-console-warnings] Target string not found in: ${screenPath}`
    );
  }
} else {
  console.warn(
    `[patch-console-warnings] Screen.js not found (expo-router layout changed?): ${screenPath}`
  );
}

// ---------------------------------------------------------------------------
// Patch 3: react-native-web — remove dev-only console.warn calls in
// ResponderTouchHistoryStore that fire when the browser delivers a touchmove/
// touchend whose matching touchstart was never observed (common with trackpads
// and emulated touch on desktop). Harmless noise; presses still work via the
// mouse-event path.
// ---------------------------------------------------------------------------
const touchStorePath = path.join(
  nodeModulesDir,
  "react-native-web",
  "src",
  "modules",
  "useResponderEvents",
  "ResponderTouchHistoryStore.js"
);

const touchWarnPatches = [
  {
    target:
      "    console.warn(\n" +
      "      'Cannot record touch move without a touch start.\\n',\n" +
      "      `Touch Move: ${printTouch(touch)}\\n`,\n" +
      "      `Touch Bank: ${printTouchBank(touchHistory)}`\n" +
      "    );",
    replacement: "",
    marker: "Cannot record touch move without a touch start.",
    label: "touch-move warn",
  },
  {
    target:
      "    console.warn(\n" +
      "      'Cannot record touch end without a touch start.\\n',\n" +
      "      `Touch End: ${printTouch(touch)}\\n`,\n" +
      "      `Touch Bank: ${printTouchBank(touchHistory)}`\n" +
      "    );",
    replacement: "",
    marker: "Cannot record touch end without a touch start.",
    label: "touch-end warn",
  },
];

if (fs.existsSync(touchStorePath)) {
  let content = fs.readFileSync(touchStorePath, "utf8");
  let patchedAny = false;

  for (const patch of touchWarnPatches) {
    if (content.includes(patch.target)) {
      content = content.replace(patch.target, patch.replacement);
      patchedAny = true;
    } else if (!content.includes(patch.marker)) {
      console.log(
        `[patch-console-warnings] Already patched (${patch.label}): ${touchStorePath}`
      );
    } else {
      console.warn(
        `[patch-console-warnings] Target string not found (${patch.label}): ${touchStorePath}`
      );
    }
  }

  if (patchedAny) {
    fs.writeFileSync(touchStorePath, content, "utf8");
    console.log(`[patch-console-warnings] Patched: ${touchStorePath}`);
  }
} else {
  console.warn(
    `[patch-console-warnings] ResponderTouchHistoryStore.js not found (react-native-web layout changed?): ${touchStorePath}`
  );
}
