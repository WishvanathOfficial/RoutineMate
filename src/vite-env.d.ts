/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
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
