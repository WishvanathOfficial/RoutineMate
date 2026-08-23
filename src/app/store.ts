import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@features/auth/auth.slice';
import uiReducer from '@features/ui/ui.slice';
import routinesReducer from '@features/routines/routines.slice';
import dashboardReducer from '@features/dashboard/dashboard.slice';
import statsReducer from '@features/stats/stats.slice';
import calendarReducer from '@features/calendar/calendar.slice';
import profileReducer from '@features/profile/profile.slice';
import landingReducer from '@features/landing/landing.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    routines: routinesReducer,
    dashboard: dashboardReducer,
    stats: statsReducer,
    calendar: calendarReducer,
    profile: profileReducer,
    landing: landingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
