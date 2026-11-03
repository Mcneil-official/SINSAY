import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAContextType {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  showInstallModal: boolean;
  isBannerDismissed: boolean;
  setShowInstallModal: (show: boolean) => void;
  promptInstall: () => Promise<boolean>;
  dismissBanner: () => void;
}

const PWAContext = createContext<PWAContextType>({
  canInstall: false,
  isInstalled: false,
  isIOS: false,
  isAndroid: false,
  isStandalone: false,
  showInstallModal: false,
  isBannerDismissed: false,
  setShowInstallModal: () => {},
  promptInstall: async () => false,
  dismissBanner: () => {},
});

const DISMISS_KEY = "sinsay_pwa_install_dismissed_v1";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return false;
    try {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      );
    } catch {
      return false;
    }
  });
  const [isIOS] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
  });
  const [isAndroid] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return false;
    return /android/.test(window.navigator.userAgent.toLowerCase());
  });
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return false;
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      return Boolean(dismissedUntil && Number(dismissedUntil) > Date.now());
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // 4. Capture beforeinstallprompt (Chromium, Android Chrome, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      console.log("[PWA] SINSAY app was successfully installed!");
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      // Dismiss for 3 days
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + 3 * 24 * 60 * 60 * 1000)
      );
    } catch {
      // Ignore
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (isInstalled) {
      return true;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        }
        return false;
      } catch (err) {
        console.warn("[PWA] Prompt error:", err);
      }
    }

    // If deferredPrompt is unavailable (iOS Safari, Firefox, or already prompted),
    // open the guided step-by-step modal
    setShowInstallModal(true);
    return false;
  }, [deferredPrompt, isInstalled]);

  const canInstall = !isInstalled && (deferredPrompt !== null || isIOS);

  return (
    <PWAContext.Provider
      value={{
        canInstall,
        isInstalled,
        isIOS,
        isAndroid,
        isStandalone: isInstalled,
        showInstallModal,
        isBannerDismissed,
        setShowInstallModal,
        promptInstall,
        dismissBanner,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAInstall() {
  return useContext(PWAContext);
}
