jest.mock('../profile.api');

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import * as profileApi from '../profile.api';
import profileReducer from '../profile.slice';
import LanguageSettingsPage from '../LanguageSettingsPage';

describe('LanguageSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads stored preferences and saves language and units together', async () => {
    (profileApi.fetchProfile as jest.Mock).mockResolvedValue({
      user: { id: 'u1', name: 'Alex', email: 'alex@example.com' },
      preferences: {
        pushRemindersEnabled: true,
        dailyDigestEnabled: false,
        weeklyEmailEnabled: true,
        language: 'es',
        units: 'imperial',
      },
    });
    (profileApi.updatePreferences as jest.Mock).mockImplementation(
      async (preferences) => preferences,
    );
    const store = configureStore({ reducer: { profile: profileReducer } });

    render(
      <Provider store={store}>
        <LanguageSettingsPage />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Language')).toHaveValue('es');
    });
    const unitSelect = screen.getByLabelText('Unidades');
    expect(unitSelect).toHaveValue('imperial');
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'hi' } });
    fireEvent.change(unitSelect, { target: { value: 'metric' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    await waitFor(() => {
      expect(profileApi.updatePreferences).toHaveBeenCalledWith({
        pushRemindersEnabled: true,
        dailyDigestEnabled: false,
        weeklyEmailEnabled: true,
        language: 'hi',
        units: 'metric',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('प्राथमिकताएँ सहेजी गईं');
  });
});
