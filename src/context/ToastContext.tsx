import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastTone = "success" | "info" | "warning" | "error";

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
}

interface ToastState extends Required<Pick<ToastOptions, "tone" | "duration">> {
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneConfig: Record<
  ToastTone,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  success: { icon: "checkmark-circle", color: colors.green },
  info: { icon: "information-circle", color: colors.primaryBlue },
  warning: { icon: "warning", color: colors.orange },
  error: { icon: "alert-circle", color: colors.red },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [translateY] = useState(() => new Animated.Value(80));
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);
  const useNativeDriver = Platform.OS !== "web";

  const dismissToast = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const dismissingId = toastId.current;
    translateY.stopAnimation();
    opacity.stopAnimation();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 80,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished && dismissingId === toastId.current) setToast(null);
    });
  }, [opacity, translateY, useNativeDriver]);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      translateY.stopAnimation();
      opacity.stopAnimation();
      const id = ++toastId.current;
      const duration = options.duration ?? 3500;
      setToast({
        message,
        tone: options.tone ?? "info",
        duration,
        action: options.action,
      });
      translateY.setValue(80);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
      ]).start();
      timer.current = setTimeout(() => {
        if (id === toastId.current) dismissToast();
      }, duration);
    },
    [dismissToast, opacity, translateY, useNativeDriver],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [opacity, translateY]);

  const config = toast ? toneConfig[toast.tone] : null;

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toast && config ? (
        <Animated.View
          pointerEvents={toast.action ? "box-none" : "none"}
          style={[
            styles.wrapper,
            {
              opacity,
              bottom: Math.max(insets.bottom + 88, 104),
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            style={styles.content}
            pointerEvents={toast.action ? "auto" : "none"}
          >
            <Ionicons name={config.icon} size={20} color={config.color} />
            <Text
              style={styles.message}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {toast.message}
            </Text>
            {toast.action ? (
              <Pressable
                onPress={() => {
                  toast.action?.onPress();
                  dismissToast();
                }}
                accessibilityRole="button"
                accessibilityLabel={toast.action.label}
              >
                <Text style={[styles.action, { color: config.color }]}>
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20000,
    elevation: 20,
  },
  content: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  message: {
    flex: 1,
    color: colors.darkText,
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    fontSize: 13,
    fontWeight: "700",
  },
});
