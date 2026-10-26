jest.mock('../journal.api');

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import * as journalApi from '../journal.api';
import journalReducer from '../journal.slice';
import JournalEntryPage from '../JournalEntryPage';
import JournalPage from '../JournalPage';

function renderJournal(path = '/journal') {
  const store = configureStore({ reducer: { journal: journalReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/:date" element={<JournalEntryPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('JournalPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a journal load error and retries the request', async () => {
    (journalApi.fetchJournalEntries as jest.Mock)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce([]);

    renderJournal();

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/No entries yet/)).toBeInTheDocument();
    expect(journalApi.fetchJournalEntries).toHaveBeenCalledTimes(2);
  });

  it('labels calendar days with their date and mood for assistive technology', async () => {
    (journalApi.fetchJournalEntries as jest.Mock).mockResolvedValue([
      {
        id: 'entry-1',
        date: '2026-10-26',
        mood: 5,
        note: 'Good day',
        createdAt: '2026-10-26T12:00:00.000Z',
      },
    ]);

    renderJournal();

    expect(
      await screen.findByRole('button', { name: /Monday, 26 October 2026, mood: Great/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Monday, 26 October 2026/ })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });
});

describe('JournalEntryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a load error and allows retrying before editing a date entry', async () => {
    (journalApi.fetchJournalEntryByDate as jest.Mock)
      .mockRejectedValueOnce(new Error('Journal unavailable'))
      .mockResolvedValueOnce(null);

    renderJournal('/journal/2026-10-25');

    expect(await screen.findByRole('alert')).toHaveTextContent('Journal unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByPlaceholderText('Write a quick reflection...')).toBeInTheDocument();
    expect(journalApi.fetchJournalEntryByDate).toHaveBeenCalledTimes(2);
  });

  it('rejects impossible date parameters instead of displaying an invalid entry form', () => {
    renderJournal('/journal/2026-02-30');

    expect(screen.getByText("That doesn't look like a valid date.")).toBeInTheDocument();
    expect(journalApi.fetchJournalEntryByDate).not.toHaveBeenCalled();
  });
});
