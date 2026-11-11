import { Platform } from "react-native";

declare const process: { env: Record<string, string | undefined> };

const GOOGLE_GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export const googleClientId = (
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || ""
).trim();

export const isGoogleGisConfigured =
  Platform.OS === "web" && Boolean(googleClientId);

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GooglePromptMomentNotification {
  isNotDisplayed?: () => boolean;
  getNotDisplayedReason?: () => string;
  isSkippedMoment?: () => boolean;
  getSkippedReason?: () => string;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce?: string;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (
    momentListener?: (notification: GooglePromptMomentNotification) => void
  ) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number | string;
    }
  ) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export interface GoogleIdTokenResult {
  idToken?: string;
  rawNonce?: string;
  cancelled?: boolean;
  error?: string;
}

type CredentialListener = (result: GoogleIdTokenResult) => void;

let scriptLoadPromise: Promise<GoogleAccountsId> | null = null;
let activeRawNonce: string | undefined;
let activeHashedNonce: string | undefined;
let activeCredentialListener: CredentialListener | null = null;

/**
 * Generates a cryptographic raw nonce and its SHA-256 hex digest.
 * Passing `hashedNonce` to Google GIS and `rawNonce` to
 * `supabase.auth.signInWithIdToken` satisfies Supabase's nonce check
 * whether "Skip nonce checks" is enabled or disabled.
 */
export async function generateNoncePair(): Promise<{
  rawNonce?: string;
  hashedNonce?: string;
}> {
  if (
    typeof window === "undefined" ||
    !window.crypto ||
    !window.crypto.getRandomValues ||
    !window.crypto.subtle
  ) {
    return {};
  }

  try {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    const rawNonce = Array.from(randomBytes, (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");

    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      encoder.encode(rawNonce)
    );
    const hashedNonce = Array.from(new Uint8Array(hashBuffer), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");

    return { rawNonce, hashedNonce };
  } catch {
    return {};
  }
}

/**
 * Loads the Google Identity Services script (`https://accounts.google.com/gsi/client`)
 * once on Web.
 */
export function loadGoogleGisScript(): Promise<GoogleAccountsId> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Google Identity Services is only available in browser environments.")
    );
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_GIS_SCRIPT_SRC}"]`
    );

    const handleLoad = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        scriptLoadPromise = null;
        reject(new Error("Google Identity Services failed to initialize."));
      }
    };

    const handleError = () => {
      scriptLoadPromise = null;
      reject(
        new Error(
          "Unable to load Google Sign-In script. Check your internet connection or ad blocker."
        )
      );
    };

    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = handleLoad;
    script.onerror = handleError;
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

async function ensureGisInitialized(
  listener: CredentialListener
): Promise<GoogleAccountsId> {
  const googleId = await loadGoogleGisScript();
  const { rawNonce, hashedNonce } = await generateNoncePair();
  activeRawNonce = rawNonce;
  activeHashedNonce = hashedNonce;
  activeCredentialListener = listener;

  googleId.initialize({
    client_id: googleClientId,
    nonce: activeHashedNonce,
    ux_mode: "popup",
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
    callback: (response: GoogleCredentialResponse) => {
      if (!response?.credential) {
        activeCredentialListener?.({
          error: "Google did not return an authentication credential.",
        });
        return;
      }
      const currentRawNonce = activeRawNonce;
      activeCredentialListener?.({
        idToken: response.credential,
        rawNonce: currentRawNonce,
      });
      // Rotate nonce pair for any subsequent sign-in attempt
      void generateNoncePair().then(({ rawNonce: nextRaw, hashedNonce: nextHash }) => {
        activeRawNonce = nextRaw;
        activeHashedNonce = nextHash;
        if (window.google?.accounts?.id && googleClientId) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            nonce: activeHashedNonce,
            ux_mode: "popup",
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
            callback: (nextResp: GoogleCredentialResponse) => {
              if (!nextResp?.credential) {
                activeCredentialListener?.({
                  error: "Google did not return an authentication credential.",
                });
                return;
              }
              activeCredentialListener?.({
                idToken: nextResp.credential,
                rawNonce: activeRawNonce,
              });
            },
          });
        }
      });
    },
  });

  return googleId;
}

/**
 * Mounts an invisible (`opacity: 0.01`) official Google Sign-In button inside `container`
 * so user taps directly open the Google Account Chooser popup showing "SINSAY"
 * (without `.supabase.co` redirect or One-Tap cooldown suppression).
 */
export async function mountGoogleOverlayButton(
  container: HTMLElement,
  onCredential: CredentialListener,
  widthPx?: number
): Promise<void> {
  if (!isGoogleGisConfigured) return;

  const googleId = await ensureGisInitialized(onCredential);
  container.innerHTML = "";
  const targetWidth = Math.max(
    200,
    Math.min(400, Math.round(widthPx || container.clientWidth || 320))
  );

  googleId.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width: targetWidth,
  });
}

/**
 * Programmatically triggers the Google Identity Services prompt and resolves
 * with `{ idToken, rawNonce }` when the user selects an account.
 */
export async function triggerGoogleGisSignIn(): Promise<GoogleIdTokenResult> {
  if (!isGoogleGisConfigured) {
    return {
      error: "EXPO_PUBLIC_GOOGLE_CLIENT_ID is not configured.",
    };
  }

  return new Promise<GoogleIdTokenResult>((resolve) => {
    let settled = false;
    const finish = (result: GoogleIdTokenResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    ensureGisInitialized(finish)
      .then((googleId) => {
        googleId.prompt((notification) => {
          if (notification.isNotDisplayed?.()) {
            const reason = notification.getNotDisplayedReason?.() || "not_displayed";
            finish({
              error: `Google Sign-In prompt could not be displayed (${reason}). Ensure ${window.location.origin} is added under Authorized JavaScript origins in Google Cloud Console.`,
            });
          } else if (notification.isSkippedMoment?.()) {
            finish({ cancelled: true });
          } else if (notification.isDismissedMoment?.()) {
            const reason = notification.getDismissedReason?.();
            if (reason !== "credential_returned") {
              finish({ cancelled: true });
            }
          }
        });
      })
      .catch((err: unknown) => {
        finish({
          error:
            err instanceof Error
              ? err.message
              : "Failed to start Google Sign-In.",
        });
      });
  });
}
