/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FEATURE_CHALLENGES?: string;
  readonly VITE_FEATURE_FRIENDS?: string;
  readonly VITE_FEATURE_ROUTINE_BUNDLES?: string;
  readonly VITE_FEATURE_FOCUS_TIMER?: string;
  readonly VITE_FEATURE_CALENDAR_SYNC?: string;
  readonly VITE_FEATURE_AI_INSIGHTS?: string;
  readonly VITE_FEATURE_FEEDBACK?: string;
  readonly VITE_FEATURE_BILLING?: string;
  readonly VITE_FEATURE_LOCALIZATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void | Promise<void>;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              width?: string;
              text?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export {};
