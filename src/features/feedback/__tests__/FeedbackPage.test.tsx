jest.mock('../feedback.api');

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as feedbackApi from '../feedback.api';
import FeedbackPage from '../FeedbackPage';

const feature = {
  id: 'feature-1',
  title: 'Calendar reminders',
  description: 'Add customizable alerts before scheduled routines.',
  votes: 7,
  status: 'planned' as const,
  createdAt: '2026-10-25T10:00:00.000Z',
  hasVoted: false,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <FeedbackPage />
    </MemoryRouter>,
  );
}

describe('FeedbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (feedbackApi.fetchFeedback as jest.Mock).mockResolvedValue([feature]);
  });

  it('shows a load failure and retries fetching community ideas', async () => {
    (feedbackApi.fetchFeedback as jest.Mock)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce([feature]);

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Calendar reminders')).toBeInTheDocument();
    expect(feedbackApi.fetchFeedback).toHaveBeenCalledTimes(2);
  });

  it('submits an idea and clears the form after success', async () => {
    (feedbackApi.createFeedback as jest.Mock).mockResolvedValue({
      ...feature,
      id: 'feature-2',
      title: 'Weekly summary',
      description: 'Email me a weekly progress summary.',
      votes: 0,
    });

    renderPage();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Weekly summary' } });
    fireEvent.change(screen.getByLabelText('Why would this help?'), {
      target: { value: 'Email me a weekly progress summary.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit idea' }));

    expect(await screen.findByText('Weekly summary')).toBeInTheDocument();
    expect(feedbackApi.createFeedback).toHaveBeenCalledWith({
      title: 'Weekly summary',
      description: 'Email me a weekly progress summary.',
    });
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue(''));
  });

  it('toggles a user vote and updates its count and accessible state', async () => {
    (feedbackApi.setFeedbackVote as jest.Mock).mockResolvedValue({
      ...feature,
      votes: 8,
      hasVoted: true,
    });

    renderPage();
    const voteButton = await screen.findByRole('button', {
      name: 'Vote for Calendar reminders. 7 votes',
    });
    fireEvent.click(voteButton);

    expect(
      await screen.findByRole('button', {
        name: 'Remove vote from Calendar reminders. 8 votes',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(feedbackApi.setFeedbackVote).toHaveBeenCalledWith('feature-1', false);
  });

  it('filters loaded ideas by a search query', async () => {
    renderPage();

    expect(await screen.findByText('Calendar reminders')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search ideas' }), {
      target: { value: 'family sharing' },
    });

    expect(screen.getByText(/No ideas match your search/)).toBeInTheDocument();
    expect(screen.queryByText('Calendar reminders')).not.toBeInTheDocument();
  });

  it('opens a scrollable public roadmap modal and closes it with Escape', async () => {
    (feedbackApi.fetchPublicRoadmap as jest.Mock).mockResolvedValue([feature]);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /View public roadmap/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Public Roadmap' });
    expect(within(dialog).getByText('Calendar reminders')).toBeInTheDocument();
    expect(dialog.querySelector('[class*="modalContent"]')?.className).toContain('modalContent');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View public roadmap/ })).toHaveFocus();
  });

  it('closes the roadmap modal with its close button', async () => {
    (feedbackApi.fetchPublicRoadmap as jest.Mock).mockResolvedValue([]);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /View public roadmap/ }));

    expect(await screen.findByRole('dialog', { name: 'Public Roadmap' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close public roadmap' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
