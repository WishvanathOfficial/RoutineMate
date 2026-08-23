export type ThemeMode = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  text: string;
}

export interface UiState {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  toasts: ToastMessage[];
  activeModal: string | null;
}
