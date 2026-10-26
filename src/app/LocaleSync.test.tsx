jest.mock('@features/profile/profile.api');

import { configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import authReducer from '@features/auth/auth.slice';
import { loginUser } from '@features/auth/auth.thunks';
import * as profileApi from '@features/profile/profile.api';
import profileReducer from '@features/profile/profile.slice';
import LocaleSync from './LocaleSync';

describe('LocaleSync', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
    jest.clearAllMocks();
  });

  it('loads the signed-in user preference and applies it to the document locale', async () => {
    (profileApi.fetchProfile as jest.Mock).mockResolvedValue({
      user: { id: 'u1', name: 'Alex', email: 'alex@example.com' },
      preferences: {
        pushRemindersEnabled: true,
        dailyDigestEnabled: false,
        weeklyEmailEnabled: false,
        language: 'hi',
        units: 'metric',
      },
    });
    const store = configureStore({ reducer: { auth: authReducer, profile: profileReducer } });
    store.dispatch(
      loginUser.fulfilled(
        {
          user: { id: 'u1', name: 'Alex', email: 'alex@example.com' },
          accessToken: 'test-token',
        },
        'test-request',
        { email: 'alex@example.com', password: 'not-used' },
      ),
    );

    render(
      <Provider store={store}>
        <LocaleSync />
      </Provider>,
    );

    await waitFor(() => expect(document.documentElement.lang).toBe('hi'));
    expect(profileApi.fetchProfile).toHaveBeenCalledTimes(1);
  });
});
