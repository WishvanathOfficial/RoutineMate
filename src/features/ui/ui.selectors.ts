import type { RootState } from '@app/store';

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed;
export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectActiveModal = (state: RootState) => state.ui.activeModal;
