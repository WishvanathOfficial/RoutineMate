import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit';
import type { UiState, ToastMessage, ThemeMode } from './ui.types';

const THEME_STORAGE_KEY = 'routinemate-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const initialState: UiState = {
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  toasts: [],
  activeModal: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themeToggled(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    sidebarToggled(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    modalOpened(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    modalClosed(state) {
      state.activeModal = null;
    },
    toastShown: {
      reducer(state, action: PayloadAction<ToastMessage>) {
        state.toasts.push(action.payload);
      },
      prepare(text: string) {
        return { payload: { id: nanoid(), text } };
      },
    },
    toastDismissed(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  themeToggled,
  sidebarToggled,
  modalOpened,
  modalClosed,
  toastShown,
  toastDismissed,
} = uiSlice.actions;

export default uiSlice.reducer;
