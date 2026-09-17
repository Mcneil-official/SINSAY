import React, { createContext, useContext, useDeferredValue, useMemo } from "react";
import { useWindowDimensions } from "react-native";

const MOBILE_BREAKPOINT = 640;
const DESKTOP_BREAKPOINT = 1024;

export type LayoutMode = "mobile" | "tablet" | "desktop";

interface LayoutState {
  mode: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  sidebarWidth: number;
  headerHeight: number;
}

const defaultState: LayoutState = {
  mode: "mobile",
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  sidebarWidth: 240,
  headerHeight: 64,
};

export const LayoutContext = createContext<LayoutState>(defaultState);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();

  // useWindowDimensions reports width=0 on the first web frame, then the
  // real width — deriving isDesktop directly flips AppShell/BottomNav
  // mobile→desktop after paint. Deferring the mode keeps all useLayout()
  // consumers on one stable snapshot per resize.
  const mode = useMemo<LayoutMode>(() => {
    if (width >= DESKTOP_BREAKPOINT) return "desktop";
    if (width >= MOBILE_BREAKPOINT) return "tablet";
    return "mobile";
  }, [width]);
  const deferredMode = useDeferredValue(mode);

  const state = useMemo<LayoutState>(() => {
    return {
      mode: deferredMode,
      isMobile: deferredMode === "mobile",
      isTablet: deferredMode === "tablet",
      isDesktop: deferredMode === "desktop",
      sidebarWidth: 240,
      headerHeight: 64,
    };
  }, [deferredMode]);

  return (
    <LayoutContext.Provider value={state}>{children}</LayoutContext.Provider>
  );
}

export function useLayout(): LayoutState {
  return useContext(LayoutContext);
}
