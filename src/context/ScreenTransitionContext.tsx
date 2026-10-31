import { useRouter, type Href } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";

interface ScreenTransitionContextValue {
  transitionTo: (href: Href) => void;
  runTransition: (action: () => void) => void;
}

const ScreenTransitionContext =
  createContext<ScreenTransitionContextValue | null>(null);

const FADE_IN_MS = 140;
const HOLD_MS = 80;
const FADE_OUT_MS = 220;

export function ScreenTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [opacity] = useState(() => new Animated.Value(0));
  const [active, setActive] = useState(false);
  const busy = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useNativeDriver = Platform.OS !== "web";

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      opacity.stopAnimation();
    };
  }, [opacity]);

  const runTransition = useCallback(
    (action: () => void) => {
      if (busy.current) return;
      busy.current = true;
      setActive(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }).start(({ finished }) => {
        if (!finished) {
          busy.current = false;
          setActive(false);
          return;
        }
        action();
        holdTimer.current = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_OUT_MS,
            easing: Easing.in(Easing.quad),
            useNativeDriver,
          }).start(() => {
            busy.current = false;
            setActive(false);
          });
        }, HOLD_MS);
      });
    },
    [opacity, useNativeDriver]
  );

  const transitionTo = useCallback(
    (href: Href) => {
      runTransition(() => router.push(href));
    },
    [router, runTransition]
  );

  const value = useMemo(
    () => ({ transitionTo, runTransition }),
    [transitionTo, runTransition]
  );

  return (
    <ScreenTransitionContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        <Animated.View
          pointerEvents={active ? "auto" : "none"}
          style={[styles.overlay, { opacity }]}
        />
      </View>
    </ScreenTransitionContext.Provider>
  );
}

export function useScreenTransition(): ScreenTransitionContextValue {
  const context = useContext(ScreenTransitionContext);
  if (!context) {
    throw new Error(
      "useScreenTransition must be used within a ScreenTransitionProvider"
    );
  }
  return context;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.splashBlue,
    zIndex: 10000,
    elevation: 10000,
  },
});
