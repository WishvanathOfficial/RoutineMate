import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RoutineBundleModal from '../components/RoutineBundleModal';
import type { Routine } from '../routines.types';

const routines: Routine[] = [
  {
    id: 'water',
    name: 'Drink Water',
    emoji: '💧',
    category: 'Health',
    frequency: 'Daily',
    reminderType: 'time',
    reminderTime: '08:00',
    reminderLocation: null,
    status: 'active',
    streak: 0,
    longestStreak: 0,
    completedToday: false,
    createdAt: '2026-10-26T00:00:00.000Z',
  },
  {
    id: 'meditation',
    name: 'Meditate',
    emoji: '🧘',
    category: 'Mindfulness',
    frequency: 'Daily',
    reminderType: 'time',
    reminderTime: '06:30',
    reminderLocation: null,
    status: 'active',
    streak: 0,
    longestStreak: 0,
    completedToday: false,
    createdAt: '2026-10-26T00:00:00.000Z',
  },
  {
    id: 'paused',
    name: 'Paused routine',
    emoji: '⏸️',
    category: 'Wellness',
    frequency: 'Daily',
    reminderType: 'time',
    reminderTime: '09:00',
    reminderLocation: null,
    status: 'paused',
    streak: 0,
    longestStreak: 0,
    completedToday: false,
    createdAt: '2026-10-26T00:00:00.000Z',
  },
];

describe('RoutineBundleModal', () => {
  it('requires at least two routines before allowing bundle creation', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(
      <RoutineBundleModal
        isOpen
        routines={routines}
        isSaving={false}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText('Bundle name'), {
      target: { value: 'Morning flow' },
    });
    fireEvent.click(screen.getByLabelText(/Drink Water/));

    const createButton = screen.getByRole('button', { name: 'Create Bundle' });
    expect(createButton).toBeDisabled();
    fireEvent.click(createButton);
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(/Meditate/));
    expect(createButton).toBeEnabled();
  });

  it('creates an ordered bundle and closes after a successful save', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <RoutineBundleModal
        isOpen
        routines={routines}
        isSaving={false}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    expect(screen.queryByLabelText(/paused routine/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Bundle name'), {
      target: { value: 'Morning flow' },
    });
    fireEvent.click(screen.getByLabelText(/Meditate/));
    fireEvent.click(screen.getByLabelText(/Drink Water/));
    fireEvent.click(screen.getByRole('button', { name: 'Create Bundle' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        title: 'Morning flow',
        routineIds: ['meditation', 'water'],
      });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a save error and keeps the modal open', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Network unavailable'));
    const onClose = jest.fn();
    render(
      <RoutineBundleModal
        isOpen
        routines={routines}
        isSaving={false}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText('Bundle name'), {
      target: { value: 'Morning flow' },
    });
    fireEvent.click(screen.getByLabelText(/Drink Water/));
    fireEvent.click(screen.getByLabelText(/Meditate/));
    fireEvent.click(screen.getByRole('button', { name: 'Create Bundle' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(onClose).not.toHaveBeenCalled();
  });
});
