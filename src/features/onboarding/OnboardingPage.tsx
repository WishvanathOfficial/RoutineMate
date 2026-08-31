import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@app/hooks';
import { createRoutineThunk } from '@features/routines/routines.thunks';
import { ROUTINE_TEMPLATES, type RoutineCategory } from '@features/routines/routines.types';
import { toastShown } from '@features/ui/ui.slice';
import logoIcon from '@assets/logo-icon.svg';
import { completeOnboardingThunk } from './onboarding.thunks';
import { ONBOARDING_CATEGORIES } from './onboarding.types';
import styles from './onboarding.module.scss';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<RoutineCategory[]>(['Health']);
  const [habitNames, setHabitNames] = useState<string[]>(() =>
    ROUTINE_TEMPLATES.filter((t) => t.category === 'Health')
      .slice(0, 2)
      .map((t) => t.name),
  );
  const [reminderTime, setReminderTime] = useState('08:00');
  const [isFinishing, setIsFinishing] = useState(false);

  const toggleCategory = (category: RoutineCategory) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const toggleHabit = (name: string) => {
    setHabitNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  // Suggested habits from the templates already used by the Routines create
  // form — reordered so ones matching a picked category surface first.
  const suggestedTemplates = useMemo(() => {
    const matching = ROUTINE_TEMPLATES.filter((t) => categories.includes(t.category));
    const rest = ROUTINE_TEMPLATES.filter((t) => !categories.includes(t.category));
    return [...matching, ...rest];
  }, [categories]);

  const handleFinish = async () => {
    // Defensive guard matching the disabled "Continue" button in step 2 —
    // docs/RoutineMate-MVP2-Scope.md §3.4 "Ends by landing on the Dashboard
    // pre-populated with 1–2 sample habits instead of an empty state".
    if (habitNames.length === 0) {
      dispatch(toastShown('Pick at least one starter habit before finishing.'));
      setStep(2);
      return;
    }

    setIsFinishing(true);
    const selectedTemplates = ROUTINE_TEMPLATES.filter((t) => habitNames.includes(t.name));

    const results = await Promise.all(
      selectedTemplates.map((template) =>
        dispatch(
          createRoutineThunk({
            name: template.name,
            emoji: template.emoji,
            category: template.category,
            frequency: template.frequency,
            reminderType: 'time',
            reminderTime,
          }),
        ),
      ),
    );
    const failures = results.filter((r) => !createRoutineThunk.fulfilled.match(r));

    await dispatch(completeOnboardingThunk({ categories, habitNames, reminderTime }));

    if (failures.length > 0) {
      dispatch(
        toastShown(
          `Welcome to RoutineMate! ${selectedTemplates.length - failures.length} of ${selectedTemplates.length} starter habits were added.`,
        ),
      );
    } else {
      dispatch(toastShown('Welcome to RoutineMate! Your starter habits are ready 🎉'));
    }
    navigate('/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <img src={logoIcon} alt="RoutineMate" />
          <h1>Let&apos;s set you up</h1>
          <p>Takes less than a minute.</p>
        </div>

        <div className={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((dot) => (
            <span key={dot} className={`${styles.dot} ${dot <= step ? styles.dotActive : ''}`} />
          ))}
        </div>

        <div className={styles.card}>
          {step === 1 && (
            <div>
              <p className={styles.stepLabel}>STEP 1 OF 3</p>
              <h2>What do you want to work on?</h2>
              <p className={styles.stepHint}>Pick as many as you like.</p>
              <div className={styles.categoryGrid}>
                {ONBOARDING_CATEGORIES.map(({ category, emoji }) => (
                  <button
                    key={category}
                    type="button"
                    className={`${styles.categoryCard} ${
                      categories.includes(category) ? styles.categoryCardSelected : ''
                    }`}
                    onClick={() => toggleCategory(category)}
                  >
                    <span className={styles.categoryEmoji}>{emoji}</span>
                    <p>{category}</p>
                  </button>
                ))}
              </div>
              <button type="button" className={styles.primaryButton} onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className={styles.stepLabel}>STEP 2 OF 3</p>
              <h2>Pick a few starter habits</h2>
              <p className={styles.stepHint}>
                We&apos;ll add these to your dashboard — you can edit anytime.
              </p>
              <div className={styles.chipRow}>
                {suggestedTemplates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    className={`${styles.chip} ${
                      habitNames.includes(template.name) ? styles.chipSelected : ''
                    }`}
                    onClick={() => toggleHabit(template.name)}
                  >
                    {template.emoji} {template.name}
                  </button>
                ))}
              </div>
              {habitNames.length === 0 && (
                <p className={styles.stepWarning}>Pick at least one habit to continue.</p>
              )}
              <div className={styles.buttonRow}>
                <button type="button" className={styles.secondaryButton} onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setStep(3)}
                  disabled={habitNames.length === 0}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className={styles.stepLabel}>STEP 3 OF 3</p>
              <h2>When should we remind you?</h2>
              <p className={styles.stepHint}>
                Your default daily reminder time — you can set per-habit times later.
              </p>
              <input
                type="time"
                className={styles.timeInput}
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
              <div className={styles.buttonRow}>
                <button type="button" className={styles.secondaryButton} onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleFinish}
                  disabled={isFinishing}
                >
                  {isFinishing ? 'Setting up…' : 'Finish Setup 🎉'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
