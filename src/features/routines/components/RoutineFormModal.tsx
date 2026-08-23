import { useEffect, useState, type FormEvent } from 'react';
import Modal from '@components/Modal/Modal';
import type {
  CreateRoutineInput,
  ReminderType,
  Routine,
  RoutineCategory,
  RoutineFrequency,
} from '../routines.types';
import { ROUTINE_TEMPLATES } from '../routines.types';
import styles from '../routines.module.scss';

interface RoutineFormModalProps {
  isOpen: boolean;
  editingRoutine: Routine | null;
  onClose: () => void;
  onSubmit: (input: CreateRoutineInput, editingId?: string) => void;
}

const CATEGORIES: RoutineCategory[] = [
  'Health',
  'Mindfulness',
  'Learning',
  'Wellness',
  'Productivity',
];
const FREQUENCIES: RoutineFrequency[] = ['Daily', 'Mon/Wed/Fri', 'Weekdays', 'Custom'];

const emptyForm: CreateRoutineInput = {
  name: '',
  emoji: '💧',
  category: 'Health',
  frequency: 'Daily',
  reminderType: 'time',
  reminderTime: '08:00',
  reminderLocation: '',
};

export default function RoutineFormModal({
  isOpen,
  editingRoutine,
  onClose,
  onSubmit,
}: RoutineFormModalProps) {
  const [form, setForm] = useState<CreateRoutineInput>(emptyForm);

  useEffect(() => {
    if (editingRoutine) {
      setForm({
        name: editingRoutine.name,
        emoji: editingRoutine.emoji,
        category: editingRoutine.category,
        frequency: editingRoutine.frequency,
        reminderType: editingRoutine.reminderType,
        reminderTime: editingRoutine.reminderTime,
        reminderLocation: editingRoutine.reminderLocation ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingRoutine, isOpen]);

  const applyTemplate = (index: number) => {
    const template = ROUTINE_TEMPLATES[index];
    setForm((prev) => ({
      ...prev,
      name: template.name,
      emoji: template.emoji,
      category: template.category,
      frequency: template.frequency,
      reminderType: 'time',
      reminderTime: template.reminderTime,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form, editingRoutine?.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRoutine ? 'Edit Routine' : 'Create New Routine'}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {!editingRoutine && (
          <div className={styles.field}>
            {/* Not a real form-control label — it heads a row of preset
                buttons, not one input — so it's a span, not <label>, to
                satisfy jsx-a11y/label-has-associated-control. */}
            <span className={styles.groupLabel}>Quick start (optional)</span>
            <div className={styles.chipRow}>
              {ROUTINE_TEMPLATES.map((template, index) => (
                <button
                  type="button"
                  key={template.name}
                  className={styles.chip}
                  onClick={() => applyTemplate(index)}
                >
                  {template.emoji} {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="routine-name">Habit name</label>
          <input
            id="routine-name"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="routine-emoji">Icon</label>
            <select
              id="routine-emoji"
              value={form.emoji}
              onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
            >
              <option value="💧">💧 Water</option>
              <option value="🧘">🧘 Meditation</option>
              <option value="📚">📚 Reading</option>
              <option value="🏃">🏃 Exercise</option>
              <option value="😴">😴 Sleep</option>
              <option value="✅">✅ General</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="routine-category">Category</label>
            <select
              id="routine-category"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value as RoutineCategory }))
              }
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="routine-frequency">Frequency</label>
          <select
            id="routine-frequency"
            value={form.frequency}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, frequency: e.target.value as RoutineFrequency }))
            }
          >
            {FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <span className={styles.groupLabel}>Reminder</span>
          <div className={styles.tabRow}>
            <button
              type="button"
              className={form.reminderType === 'time' ? styles.tabActive : styles.tab}
              onClick={() => setForm((prev) => ({ ...prev, reminderType: 'time' as ReminderType }))}
            >
              Time-based
            </button>
            <button
              type="button"
              className={form.reminderType === 'location' ? styles.tabActive : styles.tab}
              onClick={() =>
                setForm((prev) => ({ ...prev, reminderType: 'location' as ReminderType }))
              }
            >
              Location-based
            </button>
          </div>
          {form.reminderType === 'time' ? (
            <input
              type="time"
              value={form.reminderTime}
              onChange={(e) => setForm((prev) => ({ ...prev, reminderTime: e.target.value }))}
            />
          ) : (
            <input
              type="text"
              placeholder="e.g. Home, Gym, Office"
              value={form.reminderLocation ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, reminderLocation: e.target.value }))}
            />
          )}
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton}>
            {editingRoutine ? 'Save Changes' : 'Create Routine'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
