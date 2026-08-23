import reducer, { themeToggled, sidebarToggled, toastShown, toastDismissed } from '../ui.slice';
import type { UiState } from '../ui.types';

const initialState: UiState = {
  theme: 'light',
  sidebarCollapsed: false,
  toasts: [],
  activeModal: null,
};

describe('ui.slice', () => {
  it('toggles the theme between light and dark', () => {
    const afterFirst = reducer(initialState, themeToggled());
    expect(afterFirst.theme).toBe('dark');

    const afterSecond = reducer(afterFirst, themeToggled());
    expect(afterSecond.theme).toBe('light');
  });

  it('toggles the sidebar collapsed flag', () => {
    const next = reducer(initialState, sidebarToggled());
    expect(next.sidebarCollapsed).toBe(true);
  });

  it('adds and removes toast messages', () => {
    const withToast = reducer(initialState, toastShown('Routine created'));
    expect(withToast.toasts).toHaveLength(1);
    expect(withToast.toasts[0].text).toBe('Routine created');

    const toastId = withToast.toasts[0].id;
    const withoutToast = reducer(withToast, toastDismissed(toastId));
    expect(withoutToast.toasts).toHaveLength(0);
  });
});
