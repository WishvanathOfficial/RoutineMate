jest.mock('../achievements.api');

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import * as achievementsApi from '../achievements.api';
import reducer from '../achievements.slice';
import AchievementsPage from '../AchievementsPage';

function renderPage() {
  const store = configureStore({ reducer: { achievements: reducer } });
  return render(
    <Provider store={store}>
      <AchievementsPage />
    </Provider>,
  );
}

describe('AchievementsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a fetch error and retries to render badges and accessible XP progress', async () => {
    (achievementsApi.fetchAchievements as jest.Mock)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({
        items: [
          {
            id: 'streak-7',
            icon: '🔥',
            title: '7-Day Streak',
            unlockedAt: '2026-08-18',
            progressLabel: null,
          },
          {
            id: 'checkins-50',
            icon: '💯',
            title: '50 Check-ins',
            unlockedAt: null,
            progressLabel: '12 more to go',
          },
        ],
        xp: {
          totalPoints: 240,
          level: 2,
          xpToNextLevel: 160,
          levelProgressPercent: 20,
        },
      });

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('7-Day Streak')).toBeInTheDocument();
    expect(screen.getByText('50 Check-ins')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 badges unlocked')).toBeInTheDocument();
    expect(screen.getByText('12 more to go')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progress to level 3' })).toHaveAttribute(
      'aria-valuenow',
      '20',
    );
    await waitFor(() => expect(achievementsApi.fetchAchievements).toHaveBeenCalledTimes(2));
  });

  it('explains when the server returns an empty achievement catalog', async () => {
    (achievementsApi.fetchAchievements as jest.Mock).mockResolvedValue({
      items: [],
      xp: { totalPoints: 0, level: 1, xpToNextLevel: 200, levelProgressPercent: 0 },
    });

    renderPage();

    expect(
      await screen.findByText('No achievements are available yet. Check back soon.'),
    ).toBeInTheDocument();
  });
});
