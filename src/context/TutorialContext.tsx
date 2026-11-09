import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const TUTORIAL_STORAGE_KEY = "@sinsay_tutorial_completed_v1";

export interface TutorialContextType {
  isTutorialActive: boolean;
  hasCompletedTutorial: boolean;
  startTutorial: () => void;
  dismissTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

function checkCompletedLocally(): boolean {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }
  return false;
}

function saveCompletedLocally(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {}
  }
}

export function TutorialProvider({
  children,
  autoPrompt = true,
}: {
  children: React.ReactNode;
  autoPrompt?: boolean;
}) {
  const [hasCompleted, setHasCompleted] = useState<boolean>(checkCompletedLocally);
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(false);

  // Initial check on mount
  useEffect(() => {
    const completed = checkCompletedLocally();
    setHasCompleted(completed);

    if (!completed && autoPrompt) {
      // Gentle settling delay so the home screen settles before spotlight appears
      const timer = setTimeout(() => {
        setIsTutorialActive(true);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [autoPrompt]);

  const startTutorial = useCallback(() => {
    setIsTutorialActive(true);
  }, []);

  const dismissTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setHasCompleted(true);
    saveCompletedLocally();
  }, []);

  const resetTutorial = useCallback(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
      } catch {}
    }
    setHasCompleted(false);
    setIsTutorialActive(true);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isTutorialActive,
        hasCompletedTutorial: hasCompleted,
        startTutorial,
        dismissTutorial,
        resetTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
