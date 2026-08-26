import React, { createContext, useContext, useMemo } from "react";
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

  const state = useMemo<LayoutState>(() => {
    let mode: LayoutMode = "mobile";
    if (width >= DESKTOP_BREAKPOINT) {
      mode = "desktop";
    } else if (width >= MOBILE_BREAKPOINT) {
      mode = "tablet";
    }
    return {
      mode,
      isMobile: mode === "mobile",
      isTablet: mode === "tablet",
      isDesktop: mode === "desktop",
      sidebarWidth: 240,
      headerHeight: 64,
    };
  }, [width]);

  return (
    <LayoutContext.Provider value={state}>{children}</LayoutContext.Provider>
  );
}

export function useLayout(): LayoutState {
  return useContext(LayoutContext);
}
