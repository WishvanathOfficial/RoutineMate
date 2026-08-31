jest.mock('../routines.api');

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import routinesReducer from '../routines.slice';
import uiReducer from '@features/ui/ui.slice';
import authReducer from '@features/auth/auth.slice';
import * as routinesApi from '../routines.api';
import type { Routine } from '../routines.types';
import RoutinesPage from '../RoutinesPage';

const seededRoutines: Routine[] = [
  {
    id: 'routine-1',
    name: 'Drink Water',
    emoji: '💧',
    category: 'Health',
    frequency: 'Daily',
    reminderType: 'time',
    reminderTime: '08:00',
    reminderLocation: null,
    status: 'active',
    streak: 12,
    longestStreak: 21,
    completedToday: true,
    createdAt: '2026-07-20T00:00:00.000Z',
  },
  {
    id: 'routine-2',
    name: 'Morning Meditation',
    emoji: '🧘',
    category: 'Mindfulness',
    frequency: 'Daily',
    reminderType: 'time',
    reminderTime: '06:30',
    reminderLocation: null,
    status: 'active',
    streak: 27,
    longestStreak: 27,
    completedToday: true,
    createdAt: '2026-07-15T00:00:00.000Z',
  },
];

function renderWithStore() {
  const store = configureStore({
    reducer: { routines: routinesReducer, ui: uiReducer, auth: authReducer },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <RoutinesPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('RoutinesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (routinesApi.fetchRoutines as jest.Mock).mockResolvedValue(seededRoutines);
    (routinesApi.deleteRoutine as jest.Mock).mockResolvedValue({ id: 'routine-1' });
  });

  it('loads and displays the seeded routines', async () => {
    renderWithStore();

    await waitFor(() => {
      expect(screen.getByText('Drink Water')).toBeInTheDocument();
    });

    expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new routine/i })).toBeInTheDocument();
  });

  it('requires confirmation before deleting a routine', async () => {
    renderWithStore();

    await waitFor(() => {
      expect(screen.getByText('Drink Water')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Drink Water' }));
    expect(screen.getByRole('dialog', { name: 'Delete Routine' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this routine?')).toBeInTheDocument();
    expect(routinesApi.deleteRoutine).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.queryByRole('dialog', { name: 'Delete Routine' })).not.toBeInTheDocument();
    expect(routinesApi.deleteRoutine).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Drink Water' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => {
      expect(routinesApi.deleteRoutine).toHaveBeenCalledWith('routine-1');
    });
  });
});
