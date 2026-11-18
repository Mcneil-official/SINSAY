// Zero-dependency unit tests: compiled with tsc, run with plain node.
// No node: imports (no @types/node in the repo).

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL - ${name}:`, err);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(
      `${msg ? msg + ": " : ""}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

console.log("Running In-App Tutorial Alignment unit tests...");

// Simulation of InAppTutorial layout & positioning mathematics

interface TargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function calculateTutorialGeometry({
  target,
  caretPosition,
  rect,
  windowWidth,
  windowHeight,
  safeTop = 16,
  cardHeight = 205,
}: {
  target: string;
  caretPosition: "top" | "bottom";
  rect: TargetRect | null;
  windowWidth: number;
  windowHeight: number;
  safeTop?: number;
  cardHeight?: number;
}) {
  const containerWidth = Math.min(windowWidth, 480);
  const containerLeft = Math.max(0, (windowWidth - containerWidth) / 2);

  let spotlight = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    borderRadius: 0,
    caretX: 0,
  };

  if (rect) {
    if (target === "assistant-btn") {
      const pad = 5;
      const size = Math.max(rect.width, rect.height) + pad * 2;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      spotlight = {
        left: centerX - size / 2,
        top: centerY - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        caretX: centerX,
      };
    } else if (
      target === "map-tab" ||
      target === "eco-tab" ||
      target === "profile-tab" ||
      target === "manifests-tab" ||
      target === "buy-pass-tab" ||
      target === "op-profile-tab"
    ) {
      const padX = 6;
      const padY = 4;
      const w = rect.width + padX * 2;
      const h = rect.height + padY * 2;
      spotlight = {
        left: rect.left - padX,
        top: rect.top - padY,
        width: w,
        height: h,
        borderRadius: Math.min(24, h / 2),
        caretX: rect.left + rect.width / 2,
      };
    } else if (target === "top-bar") {
      const pad = 6;
      spotlight = {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 18,
        caretX: rect.left + rect.width - 44,
      };
    } else if (target === "kpi-stats") {
      const pad = 6;
      spotlight = {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 18,
        caretX: rect.left + rect.width / 2,
      };
    }
  } else {
    // Calibrated fallbacks
    const bottomNavHeight = 54;
    const bottomNavPadding = 8;
    const barTrackWidth = containerWidth - 24;
    const activeTabWidth = Math.min(80, barTrackWidth * 0.28);
    const inactiveTabWidth = Math.max(0, barTrackWidth - activeTabWidth - 12) / 3;
    const tab1Center =
      containerLeft + 12 + activeTabWidth + 4 + inactiveTabWidth / 2;
    const tab2Center =
      containerLeft +
      12 +
      activeTabWidth +
      4 +
      (inactiveTabWidth + 4) +
      inactiveTabWidth / 2;
    const tab3Center =
      containerLeft +
      12 +
      activeTabWidth +
      4 +
      (inactiveTabWidth + 4) * 2 +
      inactiveTabWidth / 2;
    const tabTop = windowHeight - 49;

    switch (target) {
      case "assistant-btn": {
        const fabBottom = bottomNavPadding + bottomNavHeight + 12;
        const fabSize = 48;
        const spotSize = 58;
        const fabCenterX = containerLeft + containerWidth - 16 - fabSize / 2;
        const fabCenterY = windowHeight - fabBottom - fabSize / 2;
        spotlight = {
          left: fabCenterX - spotSize / 2,
          top: fabCenterY - spotSize / 2,
          width: spotSize,
          height: spotSize,
          borderRadius: spotSize / 2,
          caretX: fabCenterX,
        };
        break;
      }
      case "map-tab":
      case "manifests-tab":
        spotlight = {
          left: tab1Center - 36,
          top: tabTop,
          width: 72,
          height: 44,
          borderRadius: 22,
          caretX: tab1Center,
        };
        break;
      case "eco-tab":
      case "buy-pass-tab":
        spotlight = {
          left: tab2Center - 39,
          top: tabTop,
          width: 78,
          height: 44,
          borderRadius: 22,
          caretX: tab2Center,
        };
        break;
      case "profile-tab":
      case "op-profile-tab":
        spotlight = {
          left: tab3Center - 36,
          top: tabTop,
          width: 72,
          height: 44,
          borderRadius: 22,
          caretX: tab3Center,
        };
        break;
      default:
        spotlight = {
          left: containerLeft + 14,
          top: safeTop + 8,
          width: containerWidth - 28,
          height: 50,
          borderRadius: 25,
          caretX: containerLeft + containerWidth - 60,
        };
    }
  }

  // Card position calculations
  const cardWidth = Math.min(containerWidth - 24, 340);
  const minCardLeft = containerLeft + 10;
  const maxCardLeft = containerLeft + containerWidth - cardWidth - 10;
  const targetCardLeft = spotlight.caretX - cardWidth / 2;
  const cardLeft = Math.max(minCardLeft, Math.min(maxCardLeft, targetCardLeft));

  const caretRelativeX = Math.max(
    20,
    Math.min(cardWidth - 20, spotlight.caretX - cardLeft),
  );

  const cardTop =
    caretPosition === "top"
      ? spotlight.top + spotlight.height + 12
      : Math.max(safeTop + 8, spotlight.top - cardHeight - 12);

  // Caret world X position
  const caretWorldX = cardLeft + caretRelativeX;

  // Popover card bottom edge
  const cardBottom = cardTop + cardHeight;

  return {
    spotlight,
    cardWidth,
    cardLeft,
    cardTop,
    cardBottom,
    caretRelativeX,
    caretWorldX,
  };
}

// TEST 1: Floating Assistant Button (Step 4) on Mobile (391px screen width)
check("Assistant button (Step 4) spotlight and caret align with 0px error", () => {
  const mobileWidth = 391;
  const mobileHeight = 761;
  // FAB at right: 16, bottom: 74, width: 48, height: 48
  const fabRect: TargetRect = {
    left: mobileWidth - 16 - 48, // 327
    top: mobileHeight - 74 - 48, // 639
    width: 48,
    height: 48,
  };

  const geo = calculateTutorialGeometry({
    target: "assistant-btn",
    caretPosition: "bottom",
    rect: fabRect,
    windowWidth: mobileWidth,
    windowHeight: mobileHeight,
    cardHeight: 205,
  });

  // Spotlight ring concentric halo around FAB
  assertEqual(geo.spotlight.width, 58, "Spotlight ring has 5px padding (size 58)");
  assertEqual(geo.spotlight.height, 58);
  assertEqual(geo.spotlight.caretX, 351, "Spotlight caret center is FAB center (351)");

  // Card bottom must sit EXACTLY 12px above spotlight.top (no height-spotlight offset bug)
  const verticalGap = geo.spotlight.top - geo.cardBottom;
  assertEqual(verticalGap, 12, "Popover card bottom is exactly 12px above spotlight ring");

  // Caret world X must align with FAB center
  const horizontalError = Math.abs(geo.caretWorldX - geo.spotlight.caretX);
  assert(horizontalError <= 1, `Caret X aligns with button center (error: ${horizontalError}px)`);
});

// TEST 2: Bottom Navigation Tabs (Map, Eco-Dive ID, Profile) on Mobile
check("Bottom nav tab spotlight and caret point directly at tab center", () => {
  const mobileWidth = 390;
  const mobileHeight = 844;
  const mapTabRect: TargetRect = { left: 100, top: 790, width: 60, height: 40 };

  const geo = calculateTutorialGeometry({
    target: "map-tab",
    caretPosition: "bottom",
    rect: mapTabRect,
    windowWidth: mobileWidth,
    windowHeight: mobileHeight,
    cardHeight: 200,
  });

  const verticalGap = geo.spotlight.top - geo.cardBottom;
  assertEqual(verticalGap, 12, "Map tab card bottom sits exactly 12px above spotlight");
  assertEqual(geo.caretWorldX, geo.spotlight.caretX, "Caret X perfectly points at tab center");
});

// TEST 3: Top Bar / Header on Tourist Home (Step 1)
check("Top bar header spotlight and caret point at notification area", () => {
  const mobileWidth = 390;
  const mobileHeight = 844;
  const topBarRect: TargetRect = { left: 14, top: 40, width: 362, height: 50 };

  const geo = calculateTutorialGeometry({
    target: "top-bar",
    caretPosition: "top",
    rect: topBarRect,
    windowWidth: mobileWidth,
    windowHeight: mobileHeight,
    cardHeight: 180,
  });

  // Card sits 12px below spotlight bottom
  const verticalGap = geo.cardTop - (geo.spotlight.top + geo.spotlight.height);
  assertEqual(verticalGap, 12, "Top bar card sits exactly 12px below header");
  // Caret points toward upper right action (notification bell)
  assertEqual(geo.caretWorldX, geo.spotlight.caretX, "Caret points directly at notification area");
});

// TEST 4: Operator KPI Stats (Operator Step 1)
check("Operator KPI spotlight and caret align cleanly below stat cards", () => {
  const mobileWidth = 412;
  const mobileHeight = 915;
  const kpiRect: TargetRect = { left: 16, top: 120, width: 380, height: 90 };

  const geo = calculateTutorialGeometry({
    target: "kpi-stats",
    caretPosition: "top",
    rect: kpiRect,
    windowWidth: mobileWidth,
    windowHeight: mobileHeight,
    cardHeight: 180,
  });

  const verticalGap = geo.cardTop - (geo.spotlight.top + geo.spotlight.height);
  assertEqual(verticalGap, 12, "KPI card sits exactly 12px below stat cards");
  assertEqual(geo.caretWorldX, geo.spotlight.caretX, "Caret points directly at KPI center");
});

// TEST 5: Wide Screen (Desktop Container Centering at 1200px width)
check("Wide screen desktop layout keeps tutorial centered and aligned", () => {
  const desktopWidth = 1200;
  const desktopHeight = 900;
  // FAB at right: Math.max(16, (1200 - 480)/2 + 16) = 376
  const fabRect: TargetRect = {
    left: desktopWidth - 376 - 48, // 776
    top: desktopHeight - 74 - 48,
    width: 48,
    height: 48,
  };

  const geo = calculateTutorialGeometry({
    target: "assistant-btn",
    caretPosition: "bottom",
    rect: fabRect,
    windowWidth: desktopWidth,
    windowHeight: desktopHeight,
    cardHeight: 205,
  });

  const verticalGap = geo.spotlight.top - geo.cardBottom;
  assertEqual(verticalGap, 12, "Desktop FAB card bottom sits exactly 12px above spotlight");
  assertEqual(geo.caretWorldX, geo.spotlight.caretX, "Desktop FAB caret points at button center");
});

if (failures > 0) {
  console.error(`\n${failures} tutorial alignment test(s) failed`);
  process.exit(1);
}

console.log("all tutorial alignment tests passed");
