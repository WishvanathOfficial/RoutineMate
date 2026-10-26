jest.mock('@api/httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { httpClient } from '@api/httpClient';
import routinesReducer from '../routines.slice';
import type { Routine } from '../routines.types';
import FocusTimerPage from '../FocusTimerPage';

const routine: Routine = {
  id: 'routine-1',
  name: 'Read',
  emoji: '📚',
  category: 'Learning',
  frequency: 'Daily',
  reminderType: 'time',
  reminderTime: '19:00',
  reminderLocation: null,
  status: 'active',
  streak: 2,
  longestStreak: 4,
  completedToday: false,
  createdAt: '2026-10-20T10:00:00.000Z',
};

function apiResponse<T>(data: T) {
  return { data: { data, success: true, message: 'Success' } };
}

function renderFocusTimer() {
  const store = configureStore({
    reducer: { routines: routinesReducer },
    preloadedState: {
      routines: { items: [routine], status: 'succeeded' as const, error: null },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <FocusTimerPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('FocusTimerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (httpClient.get as jest.Mock).mockResolvedValue(
      apiResponse({
        totalSeconds: 1500,
        sessions: [
          {
            id: 'session-1',
            routineId: routine.id,
            durationSeconds: 1500,
            completedAt: '2026-10-25T10:00:00.000Z',
          },
        ],
      }),
    );
  });

  it('shows routine selection, focus summary, and recent sessions', async () => {
    renderFocusTimer();

    expect(screen.getByRole('heading', { name: 'Focus Timer' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '📚 Read' })).toBeInTheDocument();
    expect(await screen.findAllByText('25 min')).toHaveLength(2);
    expect(screen.getByText('1 completed sessions')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('starts, pauses, resumes and completes a focus session', async () => {
    (httpClient.post as jest.Mock)
      .mockResolvedValueOnce(
        apiResponse({
          id: 'session-2',
          routineId: routine.id,
          status: 'running',
          durationSeconds: 0,
        }),
      )
      .mockResolvedValueOnce(apiResponse({}));
    (httpClient.patch as jest.Mock).mockResolvedValue(
      apiResponse({
        id: 'session-2',
        routineId: routine.id,
        status: 'paused',
        durationSeconds: 0,
      }),
    );

    renderFocusTimer();
    fireEvent.change(screen.getByRole('combobox', { name: 'Focus routine' }), {
      target: { value: routine.id },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start focus' }));

    expect(await screen.findByText('Focus in progress')).toBeInTheDocument();
    expect(httpClient.post).toHaveBeenCalledWith('/api/focus-sessions', {
      routineId: routine.id,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(await screen.findByText('Paused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await waitFor(() =>
      expect(httpClient.patch).toHaveBeenLastCalledWith(
        '/api/focus-sessions/session-2',
        expect.objectContaining({ status: 'running' }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Complete session' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Complete session' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Focus session completed. Nice work!',
    );
    expect(httpClient.post).toHaveBeenLastCalledWith(
      '/api/focus-sessions/session-2/complete',
      expect.objectContaining({ durationSeconds: expect.any(Number) }),
    );
  });
});
